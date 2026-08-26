import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 for HEAD request to verify file exists
async function createSignedHeadRequest(
  r2Endpoint: string,
  bucketName: string,
  objectKey: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<{ url: string; headers: Record<string, string> }> {
  const algorithm = "AWS4-HMAC-SHA256";
  const service = "s3";
  const region = "auto";
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const endpointUrl = new URL(r2Endpoint);
  const host = `${bucketName}.${endpointUrl.hostname}`;
  const url = `https://${host}/${objectKey}`;
  
  const canonicalUri = `/${objectKey}`;
  const canonicalQueryString = "";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalRequest = [
    "HEAD",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  
  const canonicalRequestHash = await sha256Hex(canonicalRequest);
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    url,
    headers: {
      "Host": host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      "Authorization": authorizationHeader,
    },
  };
}

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

async function hmacHex(key: ArrayBuffer, message: string): Promise<string> {
  const result = await hmac(key, message);
  return Array.from(new Uint8Array(result))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmac(encoder.encode("AWS4" + secretKey).buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  return kSigning;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("[media-confirm-upload] Request received");
    
    // Get R2 credentials
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT");
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.error("[media-confirm-upload] Missing R2 credentials");
      return new Response(
        JSON.stringify({ error: "R2 credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { assetId } = body;
    
    if (!assetId) {
      return new Response(
        JSON.stringify({ error: "assetId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[media-confirm-upload] Confirming asset:", assetId);
    
    // Get asset record
    const { data: asset, error: fetchError } = await supabase
      .from("video_metadata")
      .select("*")
      .eq("id", assetId)
      .eq("user_id", userId)
      .single();
    
    if (fetchError || !asset) {
      console.error("[media-confirm-upload] Asset not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Asset not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!asset.r2_key) {
      return new Response(
        JSON.stringify({ error: "Asset missing R2 key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[media-confirm-upload] Verifying file on R2:", asset.r2_key);
    
    // Verify file exists on R2 with HEAD request
    const { url, headers } = await createSignedHeadRequest(
      R2_ENDPOINT,
      R2_BUCKET_NAME,
      asset.r2_key,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY
    );
    
    const headResponse = await fetch(url, {
      method: "HEAD",
      headers,
    });
    
    console.log("[media-confirm-upload] R2 HEAD response:", headResponse.status);
    
    if (!headResponse.ok) {
      console.error("[media-confirm-upload] File not found on R2");
      return new Response(
        JSON.stringify({ error: "File not found on R2. Upload may have failed." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get content length from R2 response
    const contentLength = headResponse.headers.get("content-length");
    
    // Build public URL
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${asset.r2_key}`
      : `https://${R2_BUCKET_NAME}.${new URL(R2_ENDPOINT).hostname}/${asset.r2_key}`;
    
    // Update asset record to confirmed
    const { error: updateError } = await supabase
      .from("video_metadata")
      .update({
        status: 'confirmed',
        r2_url: publicUrl,
        file_size_bytes: contentLength ? parseInt(contentLength) : asset.file_size_bytes,
      })
      .eq("id", assetId)
      .eq("user_id", userId);
    
    if (updateError) {
      console.error("[media-confirm-upload] Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update asset record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[media-confirm-upload] Asset confirmed successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        publicUrl,
        assetId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: unknown) {
    console.error("[media-confirm-upload] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
