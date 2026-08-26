-- Create api_keys table for managing developer API keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create api_usage_logs table for analytics
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX idx_usage_logs_api_key ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_usage_logs_created_at ON public.api_usage_logs(created_at);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for api_keys (admin only management)
CREATE POLICY "Admins can view all API keys"
ON public.api_keys FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert API keys"
ON public.api_keys FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update API keys"
ON public.api_keys FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete API keys"
ON public.api_keys FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for api_usage_logs (admin only)
CREATE POLICY "Admins can view all usage logs"
ON public.api_usage_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert logs"
ON public.api_usage_logs FOR INSERT
WITH CHECK (true);

-- Function to get daily usage count for an API key
CREATE OR REPLACE FUNCTION public.get_daily_usage_count(p_api_key_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.api_usage_logs
  WHERE api_key_id = p_api_key_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day'
$$;