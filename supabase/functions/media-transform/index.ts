import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransformRequest {
  videoId: string;
  type: "thumbnail" | "preview" | "poster" | "resize";
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "gif" | "mp4";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const workerUrl = Deno.env.get("CLOUDFLARE_WORKER_URL");

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { videoId, type, width, height, quality, format }: TransformRequest = await req.json();

    console.log(`[media-transform] Processing ${type} for video ${videoId}`);

    // Get video metadata
    const { data: video, error: videoError } = await supabase
      .from("video_metadata")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoError || !video) {
      console.error("[media-transform] Video not found:", videoError);
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we already have cached transform
    const cacheKey = `${type}_${width || "auto"}_${height || "auto"}_${quality || "default"}`;
    const cachedUrls = video.resized_urls || {};
    
    if (cachedUrls[cacheKey]) {
      console.log(`[media-transform] Returning cached ${type}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: cachedUrls[cacheKey],
          cached: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no Cloudflare Worker configured, return placeholder logic
    if (!workerUrl) {
      console.log("[media-transform] No Cloudflare Worker configured, using fallback");
      
      // For thumbnail/poster, we can use the original video URL with timestamp
      // The frontend will handle showing the first frame
      const transformedUrl = video.r2_url;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: transformedUrl,
          type,
          fallback: true,
          message: "Using original video (Cloudflare Worker not configured)"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build transform request for Cloudflare Worker
    const transformParams = new URLSearchParams({
      url: video.r2_url || "",
      type,
      ...(width && { width: width.toString() }),
      ...(height && { height: height.toString() }),
      ...(quality && { quality: quality.toString() }),
      ...(format && { format }),
    });

    console.log(`[media-transform] Calling Cloudflare Worker: ${workerUrl}`);

    // Call Cloudflare Worker
    const workerResponse = await fetch(`${workerUrl}?${transformParams}`, {
      method: "GET",
      headers: {
        "X-Video-Id": videoId,
        "X-User-Id": user.id,
      },
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error("[media-transform] Worker error:", errorText);
      return new Response(
        JSON.stringify({ error: "Transform failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await workerResponse.json();

    // Cache the transformed URL
    if (result.url) {
      const updatedUrls = { ...cachedUrls, [cacheKey]: result.url };
      
      // Update specific field based on type
      const updateData: Record<string, unknown> = { resized_urls: updatedUrls };
      if (type === "thumbnail") updateData.thumbnail_url = result.url;
      if (type === "preview") updateData.preview_gif_url = result.url;

      await supabase
        .from("video_metadata")
        .update(updateData)
        .eq("id", videoId);

      console.log(`[media-transform] Cached ${type} URL for video ${videoId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: result.url,
        type,
        cached: false
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": getCacheControl(type)
        } 
      }
    );

  } catch (error) {
    console.error("[media-transform] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getCacheControl(type: string): string {
  switch (type) {
    case "thumbnail":
    case "poster":
      return "public, max-age=2592000, immutable"; // 30 days
    case "preview":
      return "public, max-age=604800"; // 7 days
    case "resize":
      return "public, max-age=86400"; // 24 hours
    default:
      return "public, max-age=3600"; // 1 hour
  }
}
