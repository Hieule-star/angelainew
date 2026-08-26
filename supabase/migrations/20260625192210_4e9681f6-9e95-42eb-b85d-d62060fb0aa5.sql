
-- 1) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only where needed
REVOKE EXECUTE ON FUNCTION public.update_session_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_daily_usage_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_light_points(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- has_role must be callable by signed-in users (used inside RLS policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- increment_light_points is called from the client by signed-in users
GRANT EXECUTE ON FUNCTION public.increment_light_points(uuid, integer) TO authenticated;

-- Edge functions use service_role; explicit grants for clarity
GRANT EXECUTE ON FUNCTION public.get_daily_usage_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_light_points(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_session_timestamp() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- 2) Storage: drop broad SELECT policy that allows LIST on the public bucket.
-- Public URLs still work (bucket remains public for GET-by-path); only the API LIST is blocked.
DROP POLICY IF EXISTS "Public can view generated images" ON storage.objects;

-- 3) api_usage_logs: restrict INSERT to service_role only (was open to all)
DROP POLICY IF EXISTS "Service role can insert logs" ON public.api_usage_logs;
CREATE POLICY "Service role can insert logs"
  ON public.api_usage_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4) user_roles: explicitly block self-escalation. Only admins (or service_role) may write.
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
