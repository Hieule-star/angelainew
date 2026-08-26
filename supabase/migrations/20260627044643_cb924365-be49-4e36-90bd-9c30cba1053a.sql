
-- Mini App Builder schema

-- 1. Status enum
DO $$ BEGIN
  CREATE TYPE public.mini_app_status AS ENUM ('draft','preview','approved','deployed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Generated apps table
CREATE TABLE IF NOT EXISTS public.ai_generated_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  app_type TEXT NOT NULL DEFAULT 'custom',
  status public.mini_app_status NOT NULL DEFAULT 'draft',
  source_code JSONB NOT NULL DEFAULT '{}'::jsonb,
  build_logs TEXT,
  preview_url TEXT,
  prompt TEXT,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  safety_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generated_apps TO authenticated;
GRANT ALL ON public.ai_generated_apps TO service_role;
ALTER TABLE public.ai_generated_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own apps" ON public.ai_generated_apps
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all apps" ON public.ai_generated_apps
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_generated_apps_updated_at
  BEFORE UPDATE ON public.ai_generated_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_apps_user ON public.ai_generated_apps(user_id, created_at DESC);

-- 3. Configurable quotas per role
CREATE TABLE IF NOT EXISTS public.mini_app_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE,
  daily_limit INTEGER,        -- NULL = unlimited
  monthly_limit INTEGER,
  burst_per_hour INTEGER,
  token_budget INTEGER,
  bonus_quota INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mini_app_quotas TO authenticated;
GRANT ALL ON public.mini_app_quotas TO service_role;
ALTER TABLE public.mini_app_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated read quotas" ON public.mini_app_quotas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage quotas" ON public.mini_app_quotas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mini_app_quotas_updated_at
  BEFORE UPDATE ON public.mini_app_quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mini_app_quotas (role, daily_limit, monthly_limit, burst_per_hour, token_budget) VALUES
  ('guest', 2, 20, 2, 20000),
  ('user', 5, 60, 3, 60000),
  ('premium', 20, 300, 8, 200000),
  ('coordinator', 100, 1500, 30, 1000000),
  ('admin', NULL, NULL, NULL, NULL)
ON CONFLICT (role) DO NOTHING;

-- 4. Per-user overrides
CREATE TABLE IF NOT EXISTS public.mini_app_quota_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extra_daily INTEGER DEFAULT 0,
  extra_monthly INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mini_app_quota_overrides TO authenticated;
GRANT ALL ON public.mini_app_quota_overrides TO service_role;
ALTER TABLE public.mini_app_quota_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own overrides" ON public.mini_app_quota_overrides
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage overrides" ON public.mini_app_quota_overrides
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Generation log
CREATE TABLE IF NOT EXISTS public.mini_app_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  app_id UUID REFERENCES public.ai_generated_apps(id) ON DELETE SET NULL,
  action TEXT NOT NULL,        -- generate | regenerate | preview | approve | deploy | block
  model TEXT,
  tokens INTEGER DEFAULT 0,
  safety_flags JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mini_app_generation_log TO authenticated;
GRANT ALL ON public.mini_app_generation_log TO service_role;
ALTER TABLE public.mini_app_generation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON public.mini_app_generation_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_mini_log_user_day ON public.mini_app_generation_log(user_id, created_at DESC);

-- 6. Quota status RPC
CREATE OR REPLACE FUNCTION public.get_mini_app_quota_status(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := COALESCE(p_user_id, auth.uid());
  v_role TEXT;
  v_quota public.mini_app_quotas%ROWTYPE;
  v_daily_used INT;
  v_monthly_used INT;
  v_extra_daily INT := 0;
  v_extra_monthly INT := 0;
BEGIN
  IF v_user IS NULL THEN
    v_role := 'guest';
  ELSIF public.has_role(v_user, 'admin') THEN
    v_role := 'admin';
  ELSIF public.has_role(v_user, 'moderator') THEN
    v_role := 'coordinator';
  ELSE
    v_role := 'user';
  END IF;

  SELECT * INTO v_quota FROM public.mini_app_quotas WHERE role = v_role;

  SELECT COUNT(*) INTO v_daily_used
  FROM public.mini_app_generation_log
  WHERE user_id = v_user
    AND action IN ('generate','regenerate')
    AND created_at >= date_trunc('day', now());

  SELECT COUNT(*) INTO v_monthly_used
  FROM public.mini_app_generation_log
  WHERE user_id = v_user
    AND action IN ('generate','regenerate')
    AND created_at >= date_trunc('month', now());

  SELECT COALESCE(SUM(extra_daily),0), COALESCE(SUM(extra_monthly),0)
    INTO v_extra_daily, v_extra_monthly
  FROM public.mini_app_quota_overrides
  WHERE user_id = v_user
    AND (expires_at IS NULL OR expires_at > now());

  RETURN jsonb_build_object(
    'role', v_role,
    'daily_used', v_daily_used,
    'daily_limit', CASE WHEN v_quota.daily_limit IS NULL THEN NULL ELSE v_quota.daily_limit + v_extra_daily END,
    'monthly_used', v_monthly_used,
    'monthly_limit', CASE WHEN v_quota.monthly_limit IS NULL THEN NULL ELSE v_quota.monthly_limit + v_extra_monthly END,
    'burst_per_hour', v_quota.burst_per_hour,
    'token_budget', v_quota.token_budget,
    'allowed', (
      v_quota.daily_limit IS NULL
      OR v_daily_used < (v_quota.daily_limit + v_extra_daily)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_mini_app_quota_status(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mini_app_quota_status(UUID) TO authenticated, service_role;
