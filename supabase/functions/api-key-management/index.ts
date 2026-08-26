import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a secure random API key
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "angel_";
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 32; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Hash API key for storage
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Parse body once for POST requests
    let body: { action?: string; name?: string; email?: string; description?: string } = {};
    if (req.method === "POST") {
      body = await req.json();
    }
    
    // Get action from body (POST) or query params (GET)
    const url = new URL(req.url);
    const action = body.action || url.searchParams.get("action");

    // ACTION: Register new API key
    if (action === "register" && req.method === "POST") {
      const { name, email, description } = body;

      // Validate input
      if (!name || !email) {
        return new Response(JSON.stringify({ 
          error: "Missing required fields", 
          message: "Name and email are required" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ 
          error: "Invalid email", 
          message: "Please provide a valid email address" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if email already has an API key
      const { data: existing } = await supabase
        .from("api_keys")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ 
          error: "Email already registered", 
          message: "This email already has an API key. Use the regenerate endpoint to get a new key." 
        }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate new API key
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 12);

      // Store in database
      const { error: insertError } = await supabase.from("api_keys").insert({
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        email,
        description: description || null,
        is_active: true,
        daily_limit: 1000,
      });

      if (insertError) {
        console.error("Error creating API key:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`New API key created for: ${name} (${email})`);

      return new Response(JSON.stringify({
        success: true,
        message: "API key created successfully",
        api_key: apiKey,
        daily_limit: 1000,
        note: "Save this API key securely. It will not be shown again!",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: Get usage statistics
    if (action === "usage" && req.method === "GET") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Missing API key" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiKey = authHeader.replace("Bearer ", "");
      const keyHash = await hashApiKey(apiKey);

      const { data: keyData, error: keyError } = await supabase
        .from("api_keys")
        .select("id, name, email, daily_limit, created_at, last_used_at")
        .eq("key_hash", keyHash)
        .single();

      if (keyError || !keyData) {
        return new Response(JSON.stringify({ error: "Invalid API key" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get today's usage
      const { data: todayUsage } = await supabase.rpc("get_daily_usage_count", {
        p_api_key_id: keyData.id
      });

      // Get total usage
      const { count: totalUsage } = await supabase
        .from("api_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("api_key_id", keyData.id);

      // Get last 7 days usage
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentLogs } = await supabase
        .from("api_usage_logs")
        .select("created_at, status_code")
        .eq("api_key_id", keyData.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({
        name: keyData.name,
        email: keyData.email,
        created_at: keyData.created_at,
        last_used_at: keyData.last_used_at,
        daily_limit: keyData.daily_limit,
        today_usage: todayUsage || 0,
        total_usage: totalUsage || 0,
        remaining_today: Math.max(0, keyData.daily_limit - (todayUsage || 0)),
        recent_requests: recentLogs?.length || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: Regenerate API key
    if (action === "regenerate" && req.method === "POST") {
      const { email } = body;

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing, error: findError } = await supabase
        .from("api_keys")
        .select("id, name")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (findError || !existing) {
        return new Response(JSON.stringify({ 
          error: "Email not found", 
          message: "No active API key found for this email. Please register first." 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate new API key
      const newApiKey = generateApiKey();
      const newKeyHash = await hashApiKey(newApiKey);
      const newKeyPrefix = newApiKey.substring(0, 12);

      // Update in database
      const { error: updateError } = await supabase
        .from("api_keys")
        .update({
          key_hash: newKeyHash,
          key_prefix: newKeyPrefix,
        })
        .eq("id", existing.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to regenerate API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`API key regenerated for: ${existing.name} (${email})`);

      return new Response(JSON.stringify({
        success: true,
        message: "API key regenerated successfully",
        api_key: newApiKey,
        note: "Your old API key is now invalid. Save this new key securely!",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: List user's API keys
    if (action === "list" && req.method === "POST") {
      const { email } = body;

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: keys, error: listError } = await supabase
        .from("api_keys")
        .select("id, key_prefix, name, email, is_active, daily_limit, created_at, last_used_at")
        .eq("email", email)
        .order("created_at", { ascending: false });

      if (listError) {
        return new Response(JSON.stringify({ error: "Failed to fetch API keys" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get today's usage for each key
      const keysWithUsage = await Promise.all(
        (keys || []).map(async (key) => {
          const { data: usage } = await supabase.rpc("get_daily_usage_count", {
            p_api_key_id: key.id,
          });
          return { ...key, today_usage: usage || 0 };
        })
      );

      return new Response(JSON.stringify({
        success: true,
        keys: keysWithUsage,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: Revoke API key
    if (action === "revoke" && req.method === "POST") {
      const { email } = body;

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing, error: findError } = await supabase
        .from("api_keys")
        .select("id, name")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (findError || !existing) {
        return new Response(JSON.stringify({ 
          error: "No active key found", 
          message: "No active API key found for this email." 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Revoke the key
      const { error: updateError } = await supabase
        .from("api_keys")
        .update({ is_active: false })
        .eq("id", existing.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to revoke API key" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`API key revoked for: ${existing.name} (${email})`);

      return new Response(JSON.stringify({
        success: true,
        message: "API key has been revoked successfully",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      error: "Invalid action", 
      available_actions: ["register", "usage", "regenerate", "list", "revoke"] 
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("api-key-management error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
