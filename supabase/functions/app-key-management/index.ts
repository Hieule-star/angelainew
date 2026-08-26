import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fingerprintAppKey,
  generateAppKey,
  maskAppKey,
} from "../_shared/validateAppKey.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // --- AuthN: require a signed-in user ---
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = userRes.user.id;

  // --- AuthZ: require admin ---
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    return json({ error: "Forbidden — admin only" }, 403);
  }

  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  switch (body.action) {
    case "get_masked": {
      const current = Deno.env.get("ANGEL_AI_APP_KEY") ?? "";
      const configured = current.length >= 32;
      const masked = configured ? maskAppKey(current) : null;
      const fingerprint = configured ? await fingerprintAppKey(current) : null;
      const { data: lastRotation } = await admin
        .from("app_key_audit_log")
        .select("action, created_at, masked_key, key_fingerprint")
        .in("action", ["generated", "rotated"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return json({ configured, masked, fingerprint, lastRotation });
    }

    case "generate":
    case "rotate": {
      const newKey = generateAppKey();
      const masked = maskAppKey(newKey);
      const fp = await fingerprintAppKey(newKey);
      const action = body.action === "generate" ? "generated" : "rotated";

      const { error: insErr } = await admin.from("app_key_audit_log").insert({
        actor_user_id: userId,
        action,
        key_fingerprint: fp,
        masked_key: masked,
        ip_address: ip,
        user_agent: ua,
      });
      if (insErr) {
        return json({ error: "Failed to write audit log" }, 500);
      }

      // Raw key returned ONCE to the calling admin. Never persisted server-side.
      return json({
        ok: true,
        key: newKey,
        masked,
        fingerprint: fp,
        warning:
          "Store this value in the ANGEL_AI_APP_KEY secret immediately. It will not be shown again.",
      });
    }

    case "list_audit": {
      const { data, error } = await admin
        .from("app_key_audit_log")
        .select(
          "id, actor_user_id, action, masked_key, key_fingerprint, ip_address, user_agent, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return json({ error: error.message }, 500);
      return json({ entries: data ?? [] });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
});
