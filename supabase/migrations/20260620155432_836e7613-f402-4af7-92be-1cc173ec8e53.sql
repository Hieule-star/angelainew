CREATE TABLE public.app_key_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('generated','rotated','viewed_masked')),
  key_fingerprint text NOT NULL,
  masked_key text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_key_audit_log TO authenticated;
GRANT ALL ON public.app_key_audit_log TO service_role;

ALTER TABLE public.app_key_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.app_key_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_app_key_audit_log_created_at ON public.app_key_audit_log(created_at DESC);