-- Create video_metadata table for R2 videos and images
CREATE TABLE public.video_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  r2_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster user queries
CREATE INDEX idx_video_metadata_user_id ON public.video_metadata(user_id);
CREATE INDEX idx_video_metadata_file_type ON public.video_metadata(file_type);
CREATE INDEX idx_video_metadata_created_at ON public.video_metadata(created_at DESC);

-- Enable RLS
ALTER TABLE public.video_metadata ENABLE ROW LEVEL SECURITY;

-- Users can view their own media
CREATE POLICY "Users can view their own media"
ON public.video_metadata
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own media
CREATE POLICY "Users can insert their own media"
ON public.video_metadata
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
CREATE POLICY "Users can update their own media"
ON public.video_metadata
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media"
ON public.video_metadata
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_video_metadata_updated_at
BEFORE UPDATE ON public.video_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();