
-- 1. Profiles columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fun_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'vi';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS synced_with_fun_api_at timestamptz;

-- 2. Unique indexes (partial, allow nulls)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_fun_id_unique ON public.profiles(fun_id) WHERE fun_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles(lower(email)) WHERE email IS NOT NULL;

-- 3. Sync log table
CREATE TABLE IF NOT EXISTS public.fun_api_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success','error')),
  error_message text,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fun_api_sync_log_user_created_idx
  ON public.fun_api_sync_log(user_id, created_at DESC);

-- 4. Grants
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT ALL ON public.fun_api_sync_log TO service_role;

ALTER TABLE public.fun_api_sync_log ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated/anon => only service_role (bypasses RLS) can access.

-- 5. Update new-user trigger to copy extra metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username, country, language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'country', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'language', ''), 'vi')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;
