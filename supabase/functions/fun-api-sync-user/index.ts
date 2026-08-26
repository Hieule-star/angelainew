// Edge Function: fun-api-sync-user
// Syncs the current Angel AI user with the FUN core platform to obtain a fun_id.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FUN_API_URL = Deno.env.get("FUN_API_URL") ?? "https://fun-core-nexus.lovable.app";
const ANGEL_AI_APP_KEY = Deno.env.get("ANGEL_AI_APP_KEY")!;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authedClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    // Optional admin override: { target_user_id }
    let targetUserId: string | null = null;
    try {
      const body = await req.clone().json().catch(() => null);
      if (body && typeof body.target_user_id === "string") {
        targetUserId = body.target_user_id;
      }
    } catch { /* ignore */ }

    const adminPre = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let userId = callerId;
    if (targetUserId && targetUserId !== callerId) {
      const { data: isAdmin } = await adminPre.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (!isAdmin) {
        return jsonResponse({ ok: false, error: "Forbidden" }, 403);
      }
      userId = targetUserId;
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, username, display_name, avatar_url, country, language, fun_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return jsonResponse(
        { ok: false, error: profileError?.message ?? "Profile not found" },
        404,
      );
    }

    if (profile.fun_id) {
      return jsonResponse({ ok: true, fun_id: profile.fun_id, skipped: true });
    }

    if (!ANGEL_AI_APP_KEY) {
      return jsonResponse({ ok: false, error: "ANGEL_AI_APP_KEY not configured" }, 500);
    }

    const requestPayload: Record<string, unknown> = { email: profile.email };
    if (profile.username) requestPayload.username = profile.username;
    if (profile.display_name) requestPayload.display_name = profile.display_name;
    if (profile.avatar_url) requestPayload.avatar_url = profile.avatar_url;
    if (profile.country) requestPayload.country = profile.country;
    if (profile.language) requestPayload.language = profile.language;

    let responsePayload: unknown = null;
    let status: "success" | "error" = "error";
    let errorMessage: string | null = null;
    let funId: string | null = null;

    try {
      const res = await fetch(`${FUN_API_URL}/api/v1/angel-ai/sync-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Key": ANGEL_AI_APP_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      const text = await res.text();
      try {
        responsePayload = JSON.parse(text);
      } catch {
        responsePayload = { raw: text };
      }

      if (res.ok && (responsePayload as any)?.success && (responsePayload as any)?.fun_id) {
        funId = (responsePayload as any).fun_id as string;
        status = "success";
        await admin
          .from("profiles")
          .update({ fun_id: funId, synced_with_fun_api_at: new Date().toISOString() })
          .eq("id", userId);
      } else {
        errorMessage = `FUN API returned ${res.status}: ${
          (responsePayload as any)?.error ?? text.slice(0, 500)
        }`;
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    await admin.from("fun_api_sync_log").insert({
      user_id: userId,
      status,
      error_message: errorMessage,
      request_payload: requestPayload,
      response_payload: responsePayload,
    });

    if (status === "success") {
      return jsonResponse({ ok: true, fun_id: funId });
    }
    return jsonResponse({ ok: false, error: errorMessage }, 502);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("fun-api-sync-user fatal:", msg);
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
