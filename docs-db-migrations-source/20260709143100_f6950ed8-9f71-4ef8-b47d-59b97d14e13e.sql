DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_topic_status') THEN
    CREATE TYPE public.knowledge_topic_status AS ENUM (
      'draft','review','approved','active','deprecated','archived'
    );
  END IF;
END $$;

ALTER TABLE public.knowledge_topics
  ADD COLUMN IF NOT EXISTS canonical_key TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS status public.knowledge_topic_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS effective_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_title TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS provided_by TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replaced_by UUID REFERENCES public.knowledge_topics(id) ON DELETE SET NULL;

UPDATE public.knowledge_topics
SET
  canonical_key = COALESCE(
    canonical_key,
    lower(regexp_replace(regexp_replace(title, '[^[:alnum:]]+', '-', 'g'), '(^-|-$)', '', 'g'))
  ),
  version = COALESCE(NULLIF(version, ''), '1.0'),
  status = COALESCE(status, 'active'::public.knowledge_topic_status),
  approved_at = COALESCE(approved_at, created_at)
WHERE canonical_key IS NULL OR version IS NULL OR version = '' OR status IS NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_topics_lifecycle
  ON public.knowledge_topics (status, effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_knowledge_topics_canonical_version
  ON public.knowledge_topics (canonical_key, version);
CREATE INDEX IF NOT EXISTS idx_knowledge_topics_replaced_by
  ON public.knowledge_topics (replaced_by);

CREATE TABLE IF NOT EXISTS public.knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.knowledge_topics(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correct','incorrect','outdated','needs_more')),
  message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_status TEXT NOT NULL DEFAULT 'open' CHECK (review_status IN ('open','reviewing','resolved','dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_feedback TO authenticated;
GRANT ALL ON public.knowledge_feedback TO service_role;

ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_topic_created
  ON public.knowledge_feedback (topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_review_status
  ON public.knowledge_feedback (review_status, created_at DESC);

DROP POLICY IF EXISTS "Anyone can view knowledge topics" ON public.knowledge_topics;
DROP POLICY IF EXISTS "Anyone can view active knowledge topics" ON public.knowledge_topics;
CREATE POLICY "Anyone can view active knowledge topics"
ON public.knowledge_topics
FOR SELECT
USING (
  status = 'active'::public.knowledge_topic_status
  AND (effective_from IS NULL OR effective_from <= now())
  AND (effective_until IS NULL OR effective_until >= now())
);

DROP POLICY IF EXISTS "Admins can view all knowledge topics" ON public.knowledge_topics;
CREATE POLICY "Admins can view all knowledge topics"
ON public.knowledge_topics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert knowledge feedback" ON public.knowledge_feedback;
CREATE POLICY "Users can insert knowledge feedback"
ON public.knowledge_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own knowledge feedback" ON public.knowledge_feedback;
CREATE POLICY "Users can view their own knowledge feedback"
ON public.knowledge_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all knowledge feedback" ON public.knowledge_feedback;
CREATE POLICY "Admins can view all knowledge feedback"
ON public.knowledge_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update knowledge feedback" ON public.knowledge_feedback;
CREATE POLICY "Admins can update knowledge feedback"
ON public.knowledge_feedback
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete knowledge feedback" ON public.knowledge_feedback;
CREATE POLICY "Admins can delete knowledge feedback"
ON public.knowledge_feedback
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));