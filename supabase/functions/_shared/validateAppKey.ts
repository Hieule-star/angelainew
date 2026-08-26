/**
 * Internal Application Key validator.
 *
 * Validates the `Authorization: Bearer <ANGEL_AI_APP_KEY>` header for trusted
 * service-to-service calls (FUN Hub Core, FUN Profile, ...).
 *
 * SECURITY:
 *  - The key value lives ONLY in the `ANGEL_AI_APP_KEY` env var (server-side).
 *  - Never returned, logged, or echoed in responses.
 *  - Comparison is constant-time to prevent timing attacks.
 */
export function validateAppKey(
  request: Request,
): { ok: true } | { ok: false; status: number; error: string } {
  const expected = Deno.env.get("ANGEL_AI_APP_KEY");
  if (!expected || expected.length < 32) {
    return { ok: false, status: 500, error: "Application key not configured" };
  }

  const header = request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!header) {
    return { ok: false, status: 401, error: "Missing Authorization header" };
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "Invalid Authorization scheme" };
  }

  const presented = match[1].trim();
  if (!constantTimeEqual(presented, expected)) {
    return { ok: false, status: 403, error: "Invalid application key" };
  }

  return { ok: true };
}

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Always compare against the larger length so timing leaks no info about
  // either side's length.
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    const ab = i < aBytes.length ? aBytes[i] : 0;
    const bb = i < bBytes.length ? bBytes[i] : 0;
    diff |= ab ^ bb;
  }
  return diff === 0;
}

/** Mask an app key for display: keeps prefix + last 4 chars. */
export function maskAppKey(key: string): string {
  if (!key) return "";
  const prefix = key.startsWith("angel_ai_live_") ? "angel_ai_live_" : key.slice(0, 8);
  const tail = key.slice(-4);
  return `${prefix}${"•".repeat(8)}${tail}`;
}

/** SHA-256 fingerprint (first 16 hex chars) of the key, safe to log. */
export async function fingerprintAppKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 16);
}

/** Generate a new cryptographically-secure application key. */
export function generateAppKey(): string {
  const bytes = new Uint8Array(28); // 28 bytes -> 56 hex chars
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `angel_ai_live_${hex}`; // 14 + 56 = 70 chars
}
