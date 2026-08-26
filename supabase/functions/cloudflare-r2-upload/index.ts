import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 implementation for R2
async function signRequest(
  method: string,
  url: URL,
  headers: Headers,
  body: ArrayBuffer | null,
  accessKeyId: string,
  secretAccessKey: string,
  region = 'auto'
): Promise<Headers> {
  const service = 's3';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // Create canonical request
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const payloadHash = await crypto.subtle.digest('SHA-256', body || new ArrayBuffer(0));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash)).map(b => b.toString(16).padStart(2, '0')).join('');

  headers.set('x-amz-date', amzDate);
  headers.set('x-amz-content-sha256', payloadHashHex);
  headers.set('host', url.host);

  const canonicalUri = url.pathname;
  const canonicalQuerystring = url.search.slice(1);
  const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHashHex}\nx-amz-date:${amzDate}\n`;

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHashHex
  ].join('\n');

  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map(b => b.toString(16).padStart(2, '0')).join('');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHashHex
  ].join('\n');

  // Calculate signature
  const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
    const enc = new TextEncoder();
    const kDate = await crypto.subtle.sign('HMAC', 
      await crypto.subtle.importKey('raw', enc.encode('AWS4' + key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      enc.encode(dateStamp)
    );
    const kRegion = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kDate, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      enc.encode(regionName)
    );
    const kService = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kRegion, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      enc.encode(serviceName)
    );
    const kSigning = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kService, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      enc.encode('aws4_request')
    );
    return kSigning;
  };

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await crypto.subtle.sign('HMAC',
    await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    new TextEncoder().encode(stringToSign)
  );
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Add authorization header
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  headers.set('Authorization', authorizationHeader);

  return headers;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get R2 credentials from environment
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');
    const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT');
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT || !R2_PUBLIC_URL) {
      console.error('Missing R2 configuration');
      return new Response(
        JSON.stringify({ error: 'R2 storage not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let userId: string | null = null;
    if (authHeader && authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    console.log('User ID:', userId || 'anonymous');

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string || 'image'; // 'image' or 'video'
    const customPath = formData.get('path') as string || '';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const allowedTypes = fileType === 'video' ? allowedVideoTypes : allowedImageTypes;

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || (fileType === 'video' ? 'mp4' : 'png');
    const folder = userId ? `users/${userId}` : 'public';
    const fileName = customPath || `${folder}/${fileType}s/${timestamp}-${randomId}.${extension}`;

    // Read file content
    const fileBuffer = await file.arrayBuffer();

    // Prepare R2 upload URL
    const r2Url = new URL(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/${fileName}`);
    const uploadHeaders = new Headers({
      'Content-Type': file.type,
      'Content-Length': fileBuffer.byteLength.toString(),
    });

    // Sign the request with AWS Signature V4
    const signedHeaders = await signRequest(
      'PUT',
      r2Url,
      uploadHeaders,
      fileBuffer,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY
    );

    // Upload to R2
    console.log('Uploading to R2:', r2Url.toString());
    const uploadResponse = await fetch(r2Url.toString(), {
      method: 'PUT',
      headers: signedHeaders,
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload error:', uploadResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to upload to R2', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct public URL
    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`;
    console.log('Upload successful. Public URL:', publicUrl);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type,
        contentType: fileType,
        userId: userId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cloudflare-r2-upload:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
