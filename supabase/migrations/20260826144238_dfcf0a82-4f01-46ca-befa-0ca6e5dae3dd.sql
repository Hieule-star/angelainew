GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, DELETE ON public.chat_history TO authenticated;
GRANT ALL ON public.chat_history TO service_role;

GRANT SELECT ON public.knowledge_topics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_topics TO authenticated;
GRANT ALL ON public.knowledge_topics TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

GRANT SELECT ON public.api_usage_logs TO authenticated;
GRANT ALL ON public.api_usage_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated;
GRANT ALL ON public.generated_images TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_metadata TO authenticated;
GRANT ALL ON public.video_metadata TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP VIEW IF EXISTS public.__grant_check;
DROP FUNCTION IF EXISTS public.__apply_migration(text);