// Shared AI chat completion helper.
// 3-tier provider routing with safe fallbacks:
//   1. Gemini Direct  (GEMINI_API_KEY)   — cheapest, primary for gemini-family models
//   2. OpenAI Direct  (OPENAI_API_KEY)   — fallback when Gemini fails
//   3. Lovable Gateway (LOVABLE_API_KEY) — final safety net
//
// All endpoints are OpenAI-compatible /chat/completions, so the request body is
// passed through with only the `model` field normalized per provider.
// Per-provider timeout: 30s. Gemini gets ONE retry on 429/5xx/network/timeout
// before falling through. Never logs API keys or message content.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_BASE = "https://api.openai.com/v1/chat/completions";
const LOVABLE_BASE = "https://ai.gateway.lovable.dev/v1/chat/completions";

const PROVIDER_TIMEOUT_MS = 30_000;

export type ProviderName = "gemini-direct" | "openai-direct" | "lovable";

export interface ProviderResult {
  response: Response;
  provider: ProviderName;
  modelUsed: string;
}

// ---- model normalization ----
function modelForGemini(model: string): string {
  return model.replace(/^google\//, "");
}
function modelForLovable(model: string): string {
  if (model.startsWith("google/") || model.startsWith("openai/")) return model;
  if (model.startsWith("gemini-")) return `google/${model}`;
  return model;
}
/**
 * Map any incoming model id to a supported OpenAI model id.
 * Match order matters: pro → flash-lite → flash (flash-lite must be checked
 * BEFORE flash, otherwise `gemini-2.5-flash-lite` would map to gpt-5-mini).
 * - openai/*  → strip prefix
 * - gemini-*-pro*           → gpt-5
 * - gemini-*-flash-lite*    → gpt-5-nano  (covers `flash-lite-preview` too)
 * - gemini-*-flash*         → gpt-5-mini
 * - default                 → gpt-5-mini
 */
function modelForOpenAI(model: string): string {
  if (model.startsWith("openai/")) return model.slice("openai/".length);
  const m = model.replace(/^google\//, "");
  if (/pro/i.test(m)) return "gpt-5";
  if (/flash-lite/i.test(m)) return "gpt-5-nano";
  if (/flash/i.test(m)) return "gpt-5-mini";
  return "gpt-5-mini";
}

// ---- fetch helpers ----
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

interface ProviderAttempt {
  ok: boolean;
  response?: Response;
  status?: number;
  retryable: boolean;
  errorMessage?: string;
}

async function callProvider(
  label: ProviderName,
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  authHeaderName: "Authorization" | "Lovable-API-Key",
): Promise<ProviderAttempt> {
  const start = Date.now();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  headers[authHeaderName] = authHeaderName === "Authorization" ? `Bearer ${apiKey}` : apiKey;

  try {
    const resp = await fetchWithTimeout(
      url,
      { method: "POST", headers, body: JSON.stringify(body) },
      PROVIDER_TIMEOUT_MS,
    );
    const dur = Date.now() - start;
    if (resp.ok) {
      console.log(`[aiProvider] ✅ ${label} status=${resp.status} model=${body.model} duration=${dur}ms`);
      return { ok: true, response: resp, status: resp.status, retryable: false };
    }
    // non-ok — peek error body for log (truncated, no auth/content)
    const errText = await resp.text().catch(() => "");
    console.warn(
      `[aiProvider] ⚠️ ${label} status=${resp.status} model=${body.model} duration=${dur}ms err=${errText.slice(0, 200)}`,
    );
    return {
      ok: false,
      response: new Response(errText, { status: resp.status, headers: resp.headers }),
      status: resp.status,
      retryable: isRetryableStatus(resp.status),
      errorMessage: errText.slice(0, 200),
    };
  } catch (err) {
    const dur = Date.now() - start;
    const msg = (err as Error).message ?? String(err);
    const isTimeout = msg.includes("aborted") || msg.includes("timeout");
    console.warn(
      `[aiProvider] ❌ ${label} threw model=${body.model} duration=${dur}ms ${isTimeout ? "TIMEOUT" : "NETWORK"} msg=${msg.slice(0, 200)}`,
    );
    return { ok: false, retryable: true, errorMessage: msg };
  }
}

/**
 * Call chat completion with 3-tier provider routing.
 * Caller signature unchanged.
 */
export async function callChatCompletion(
  body: Record<string, unknown> & { model: string; stream?: boolean },
): Promise<ProviderResult> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const isGeminiFamily =
    body.model.startsWith("gemini-") || body.model.startsWith("google/gemini-");

  // ---- Tier 1: Gemini direct (with 1 retry on retryable failures) ----
  if (isGeminiFamily && GEMINI_API_KEY) {
    const geminiModel = modelForGemini(body.model);
    const geminiBody = { ...body, model: geminiModel };

    let attempt = await callProvider("gemini-direct", GEMINI_BASE, GEMINI_API_KEY, geminiBody, "Authorization");
    if (attempt.ok && attempt.response) {
      return { response: attempt.response, provider: "gemini-direct", modelUsed: geminiModel };
    }
    if (attempt.retryable) {
      console.log(`[aiProvider] 🔁 gemini-direct retry (1/1)`);
      attempt = await callProvider("gemini-direct", GEMINI_BASE, GEMINI_API_KEY, geminiBody, "Authorization");
      if (attempt.ok && attempt.response) {
        return { response: attempt.response, provider: "gemini-direct", modelUsed: geminiModel };
      }
    }
    // fall through to OpenAI
  }

  // ---- Tier 2: OpenAI direct ----
  if (OPENAI_API_KEY) {
    const openaiModel = modelForOpenAI(body.model);
    const openaiBody: Record<string, unknown> = { ...body, model: openaiModel };
    // GPT-5 family only accepts default temperature (1) and uses max_completion_tokens.
    if (/^gpt-5/i.test(openaiModel)) {
      delete openaiBody.temperature;
      delete openaiBody.top_p;
      if ("max_tokens" in openaiBody) {
        openaiBody.max_completion_tokens = openaiBody.max_tokens;
        delete openaiBody.max_tokens;
      }
    }
    const attempt = await callProvider("openai-direct", OPENAI_BASE, OPENAI_API_KEY, openaiBody, "Authorization");
    if (attempt.ok && attempt.response) {
      return { response: attempt.response, provider: "openai-direct", modelUsed: openaiModel };
    }
    // fall through to Lovable
  }


  // ---- Tier 3: Lovable Gateway ----
  if (!LOVABLE_API_KEY) {
    throw new Error("No AI provider available (GEMINI/OPENAI/LOVABLE keys all missing or failed)");
  }
  const lovableModel = modelForLovable(body.model);
  const lovableBody = { ...body, model: lovableModel };
  const start = Date.now();
  const resp = await fetchWithTimeout(
    LOVABLE_BASE,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lovableBody),
    },
    PROVIDER_TIMEOUT_MS,
  );
  console.log(
    `[aiProvider] ${resp.ok ? "✅" : "❌"} lovable status=${resp.status} model=${lovableModel} duration=${Date.now() - start}ms`,
  );
  return { response: resp, provider: "lovable", modelUsed: lovableModel };
}
