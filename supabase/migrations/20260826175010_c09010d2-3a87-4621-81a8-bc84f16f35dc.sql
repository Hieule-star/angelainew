CREATE TABLE public.keepalive_heartbeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pinged_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.keepalive_heartbeat TO service_role;

ALTER TABLE public.keepalive_heartbeat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages heartbeats"
ON public.keepalive_heartbeat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_keepalive_heartbeat_pinged_at ON public.keepalive_heartbeat(pinged_at DESC);