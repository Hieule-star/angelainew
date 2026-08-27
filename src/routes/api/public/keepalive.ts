import { createFileRoute } from '@tanstack/react-router';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function handleKeepalive(request: Request): Promise<Response> {
  const expected = process.env['KEEPALIVE_SECRET'];
  if (!expected) {
    return Response.json({ ok: false, error: 'Not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const provided =
    request.headers.get('x-keepalive-secret') ?? url.searchParams.get('secret') ?? '';

  if (!timingSafeEqual(provided, expected)) {
    // Debug info: never reveals the secret itself, only shape mismatches.
    const debug = {
      provided_via: request.headers.get('x-keepalive-secret')
        ? 'header'
        : url.searchParams.get('secret')
          ? 'query'
          : 'none',
      provided_length: provided.length,
      expected_length: expected.length,
      length_match: provided.length === expected.length,
      has_whitespace: provided !== provided.trim(),
      reason:
        provided.length === 0
          ? 'missing_secret'
          : provided.trim() === expected
            ? 'secret_has_surrounding_whitespace'
            : provided.length !== expected.length
              ? 'wrong_secret_length'
              : 'wrong_secret_value',
    };
    return Response.json({ ok: false, error: 'Unauthorized', debug }, { status: 401 });
  }

  const source = url.searchParams.get('source') ?? 'github-action';

  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const pingedAt = new Date().toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('keepalive_heartbeat')
      .insert({ pinged_at: pingedAt, source });

    if (insertError) throw insertError;

    // Housekeeping: drop heartbeats older than 30 days.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from('keepalive_heartbeat').delete().lt('pinged_at', cutoff);

    return Response.json(
      { ok: true, pinged_at: pingedAt, source },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[keepalive] ping failed:', error);
    return Response.json({ ok: false, error: 'Ping failed' }, { status: 500 });
  }
}

export const Route = createFileRoute('/api/public/keepalive')({
  server: {
    handlers: {
      GET: async ({ request }) => handleKeepalive(request),
      POST: async ({ request }) => handleKeepalive(request),
    },
  },
});
