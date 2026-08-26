-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'Cuộc trò chuyện mới',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add session_id to chat_history
ALTER TABLE public.chat_history 
ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

-- Enable RLS on chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own sessions"
ON public.chat_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.chat_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.chat_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update session's updated_at when new message is added
CREATE OR REPLACE FUNCTION public.update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_id IS NOT NULL THEN
    UPDATE public.chat_sessions
    SET updated_at = now()
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update session timestamp on new message
CREATE TRIGGER update_session_on_message
AFTER INSERT ON public.chat_history
FOR EACH ROW
EXECUTE FUNCTION public.update_session_timestamp();