
CREATE TABLE IF NOT EXISTS public.system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_prompts TO authenticated;
GRANT ALL ON public.system_prompts TO service_role;

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system prompts"
  ON public.system_prompts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system prompts"
  ON public.system_prompts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system prompts"
  ON public.system_prompts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system prompts"
  ON public.system_prompts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.system_prompts_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.system_prompts(id) ON DELETE CASCADE,
  slug text NOT NULL,
  content text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.system_prompts_history TO authenticated;
GRANT ALL ON public.system_prompts_history TO service_role;

ALTER TABLE public.system_prompts_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system prompt history"
  ON public.system_prompts_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert system prompt history"
  ON public.system_prompts_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_system_prompt(_slug text, _content text)
RETURNS public.system_prompts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_row public.system_prompts;
  v_old_content text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT content INTO v_old_content FROM public.system_prompts WHERE slug = _slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'System prompt not found: %', _slug;
  END IF;

  IF v_old_content IS DISTINCT FROM _content THEN
    INSERT INTO public.system_prompts_history (prompt_id, slug, content, changed_by)
    SELECT id, slug, v_old_content, auth.uid() FROM public.system_prompts WHERE slug = _slug;
  END IF;

  UPDATE public.system_prompts
     SET content = _content,
         updated_by = auth.uid(),
         updated_at = now()
   WHERE slug = _slug
   RETURNING * INTO v_row;

  RETURN v_row;
END;
$fn$;

REVOKE ALL ON FUNCTION public.update_system_prompt(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_system_prompt(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_system_prompt(text, text) TO authenticated;
