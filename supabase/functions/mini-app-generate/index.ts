// Mini App Builder generation endpoint.
// Generates a self-contained React+TS+Tailwind mini app from a user prompt.
// - Enforces per-role quota (mini_app_quotas + overrides)
// - Pre/post safety filters
// - Routes Gemini Flash (simple) / Pro (complex) → Lovable Gateway fallback
// - Stores result in ai_generated_apps and audit log

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callChatCompletion } from "../_shared/aiProvider.ts";
import {
  PROMPT_BLOCKLIST,
  CODE_BLOCKLIST,
  scanText,
  shouldBlock,
} from "../_shared/miniAppSafety.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are Angel AI — a safe mini-app generator for the FUN.RICH ecosystem.

Generate ONE self-contained React + TypeScript + Tailwind mini app or mini game.

STRICT OUTPUT FORMAT — return ONLY this JSON (no markdown fence, no prose):
{
  "title": "Short Title (max 60 chars)",
  "description": "1-2 sentence summary for the user",
  "app_type": "quiz|memory|clicker|puzzle|spin|breathing|platformer|reaction|custom",
  "summary": "Plain-language explanation of what the app does and how to play",
  "entry": "App.tsx",
  "files": {
    "App.tsx": "export default function App() { ... }"
  }
}

CODE RULES (NON-NEGOTIABLE):
- Single file App.tsx exporting default React component.
- Use React hooks (useState, useEffect, useRef, useMemo). React is global — DO NOT import it.
- Tailwind utility classes available via CDN. No external CSS files.
- NO npm imports, NO require(), NO dynamic import(), NO fetch to external URLs.
- NO localStorage, sessionStorage, document.cookie, window.parent, window.top, window.opener.
- NO eval, NO new Function, NO innerHTML with user input.
- NO references to secrets, env vars, supabase, API keys.
- Self-contained — all assets inline (SVG/emoji). No <img src="https://...">.
- Use semantic Tailwind colors (bg-white, text-slate-800, bg-gradient-to-br from-amber-50 to-rose-50 etc.).
- Mobile-responsive. Keep code under 400 lines.
- Light, joyful, Angel-AI aesthetic: warm whites, gold accents, pastel pink/blue when fitting.

Reject and refuse with {"error":"refused","reason":"..."} if the prompt asks for: phishing, scams, wallet draining, credential theft, malware, NSFW, or anything harmful.`;

interface GenerateBody {
  prompt: string;
  template?: string;
  app_id?: string; // for regenerate
  model?: "gemini-3.1-flash-lite" | "gemini-2.5-pro";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // user-scoped client to identify caller
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
  const userId = userData.user.id;

  // service client for writes / quota check
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt || prompt.length < 5 || prompt.length > 4000) {
    return json({ error: "invalid_prompt", message: "Prompt 5–4000 chars required" }, 400);
  }

  // ---- Quota check ----
  const { data: quotaRaw } = await admin.rpc("get_mini_app_quota_status", {
    p_user_id: userId,
  });
  const quota = (quotaRaw ?? {}) as {
    allowed?: boolean;
    daily_used?: number;
    daily_limit?: number | null;
    monthly_used?: number;
    monthly_limit?: number | null;
    role?: string;
  };
  if (quota.allowed === false) {
    return json(
      {
        error: "quota_exceeded",
        message: `Bạn đã dùng hết ${quota.daily_limit} mini app hôm nay (role: ${quota.role}). Thử lại ngày mai nhé 🌿`,
        quota,
      },
      429,
    );
  }

  // ---- Pre-filter prompt ----
  const promptFlags = scanText(prompt, PROMPT_BLOCKLIST);
  if (shouldBlock(promptFlags)) {
    await admin.from("mini_app_generation_log").insert({
      user_id: userId,
      action: "block",
      safety_flags: promptFlags,
      error_message: "prompt blocked",
    });
    return json(
      { error: "prompt_blocked", flags: promptFlags, message: "Yêu cầu vi phạm chính sách an toàn." },
      400,
    );
  }

  // ---- Model selection ----
  const model = body.model
    ?? (prompt.length > 800 || /multi.?file|complex|advanced/i.test(prompt)
        ? "gemini-2.5-pro"
        : "gemini-3.1-flash-lite");

  // ---- Call AI ----
  let aiJsonText = "";
  let modelUsed = model;
  let provider = "unknown";
  let tokens = 0;
  try {
    const result = await callChatCompletion({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `User request:\n${prompt}\n\nTemplate hint: ${body.template ?? "none"}` },
      ],
      temperature: 0.7,
      max_completion_tokens: 6000,
      response_format: { type: "json_object" },
    });
    provider = result.provider;
    modelUsed = result.modelUsed;
    if (!result.response.ok) {
      const errText = await result.response.text();
      throw new Error(`AI ${result.response.status}: ${errText.slice(0, 300)}`);
    }
    const data = await result.response.json();
    aiJsonText = data?.choices?.[0]?.message?.content ?? "";
    tokens = data?.usage?.total_tokens ?? 0;
  } catch (e) {
    await admin.from("mini_app_generation_log").insert({
      user_id: userId,
      action: "generate",
      model,
      error_message: (e as Error).message,
    });
    return json({ error: "ai_failed", message: (e as Error).message }, 502);
  }

  // ---- Parse ----
  let parsed: any;
  try {
    parsed = JSON.parse(aiJsonText);
  } catch {
    return json({ error: "ai_invalid_json", raw: aiJsonText.slice(0, 500) }, 502);
  }
  if (parsed?.error === "refused") {
    return json({ error: "ai_refused", reason: parsed.reason }, 400);
  }
  const files = parsed?.files ?? {};
  const entryName = parsed?.entry ?? "App.tsx";
  const entryCode: string = files[entryName] ?? "";
  if (!entryCode || typeof entryCode !== "string") {
    return json({ error: "ai_no_code", parsed }, 502);
  }

  // ---- Post-filter code ----
  const codeFlags = scanText(entryCode, CODE_BLOCKLIST);
  if (shouldBlock(codeFlags)) {
    await admin.from("mini_app_generation_log").insert({
      user_id: userId,
      action: "block",
      model: modelUsed,
      tokens,
      safety_flags: codeFlags,
      error_message: "generated code blocked",
    });
    return json(
      { error: "code_blocked", flags: codeFlags, message: "Mã sinh ra chứa pattern không an toàn. Đã chặn." },
      400,
    );
  }

  // ---- Persist ----
  const isRegen = !!body.app_id;
  let appRow;
  if (isRegen) {
    const { data, error } = await admin
      .from("ai_generated_apps")
      .update({
        title: parsed.title ?? "Mini App",
        description: parsed.description ?? "",
        app_type: parsed.app_type ?? "custom",
        source_code: files,
        prompt,
        model_used: `${provider}:${modelUsed}`,
        tokens_used: tokens,
        safety_flags: codeFlags,
        status: "preview",
        build_logs: parsed.summary ?? null,
      })
      .eq("id", body.app_id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return json({ error: "db_update_failed", message: error.message }, 500);
    appRow = data;
  } else {
    const { data, error } = await admin
      .from("ai_generated_apps")
      .insert({
        user_id: userId,
        title: parsed.title ?? "Mini App",
        description: parsed.description ?? "",
        app_type: parsed.app_type ?? "custom",
        source_code: files,
        prompt,
        model_used: `${provider}:${modelUsed}`,
        tokens_used: tokens,
        safety_flags: codeFlags,
        status: "preview",
        build_logs: parsed.summary ?? null,
      })
      .select()
      .single();
    if (error) return json({ error: "db_insert_failed", message: error.message }, 500);
    appRow = data;
  }

  await admin.from("mini_app_generation_log").insert({
    user_id: userId,
    app_id: appRow.id,
    action: isRegen ? "regenerate" : "generate",
    model: `${provider}:${modelUsed}`,
    tokens,
    safety_flags: codeFlags,
  });

  return json({ app: appRow, summary: parsed.summary, quota });
});
