-- RLS policies for admins to manage knowledge_topics
CREATE POLICY "Admins can insert knowledge topics"
ON public.knowledge_topics
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update knowledge topics"
ON public.knowledge_topics
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete knowledge topics"
ON public.knowledge_topics
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));