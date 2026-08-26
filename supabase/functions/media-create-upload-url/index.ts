import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 implementation for presigned URLs
async function createPresignedUrl(
  method: string,
  r2Endpoint: string,
  bucketName: string,
  objectKey: string,
  accessKeyId: string,
  secretAccessKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const algorithm = "AWS4-HMAC-SHA256";
  const service = "s3";
  const region = "auto";
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  // Parse R2 endpoint to get host
  const endpointUrl = new URL(r2Endpoint);
  const host = `${bucketName}.${endpointUrl.hostname}`;
  
  // Canonical URI
  const canonicalUri = `/${objectKey}`;
  
  // Query parameters for presigned URL
  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": algorithm,
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "content-type;host",
  });
  
  // Sort query parameters
  const sortedParams = new URLSearchParams([...queryParams.entries()].sort());
  const canonicalQueryString = sortedParams.toString();
  
  // Canonical headers
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  
  // Canonical request
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  
  // String to sign
  const canonicalRequestHash = await sha256Hex(canonicalRequest);
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");
  
  // Calculate signature
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  
  // Add signature to query params
  sortedParams.append("X-Amz-Signature", signature);
  
  // Construct presigned URL
  const presignedUrl = `https://${host}${canonicalUri}?${sortedParams.toString()}`;
  
  return presignedUrl;
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
    console.log("[media-create-upload-url] Request received");
    
    // Get R2 credentials
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT");
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      console.error("[media-create-upload-url] Missing R2 credentials");
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
    const { fileName, fileType, fileSize, duration } = body;
    
    console.log("[media-create-upload-url] File info:", { fileName, fileType, fileSize, userId });
    
    // Validate file type
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return new Response(
        JSON.stringify({ error: `File type not allowed: ${fileType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate file size (max 4GB)
    const maxSize = 4 * 1024 * 1024 * 1024;
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size: 4GB` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate unique object key
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().split('-')[0];
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const isVideo = fileType.startsWith('video/');
    const folder = isVideo ? 'videos' : 'images';
    const objectKey = `${folder}/${userId}/${timestamp}-${randomId}-${sanitizedFileName}`;
    
    console.log("[media-create-upload-url] Object key:", objectKey);
    
    // Create presigned URL (expires in 1 hour)
    const presignedUrl = await createPresignedUrl(
      "PUT",
      R2_ENDPOINT,
      R2_BUCKET_NAME,
      objectKey,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      fileType,
      3600
    );
    
    console.log("[media-create-upload-url] Presigned URL created");
    
    // Create pending record in database
    const { data: asset, error: dbError } = await supabase
      .from("video_metadata")
      .insert({
        user_id: userId,
        title: fileName,
        file_type: isVideo ? 'video' : 'image',
        file_size_bytes: fileSize,
        duration_seconds: duration ? Math.floor(duration) : null,
        mime_type: fileType,
        status: 'pending',
        r2_key: objectKey,
      })
      .select()
      .single();
    
    if (dbError) {
      console.error("[media-create-upload-url] DB error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to create asset record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[media-create-upload-url] Asset created:", asset.id);
    
    // Return presigned URL and asset info
    return new Response(
      JSON.stringify({
        uploadUrl: presignedUrl,
        assetId: asset.id,
        objectKey: objectKey,
        publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${objectKey}` : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: unknown) {
    console.error("[media-create-upload-url] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
