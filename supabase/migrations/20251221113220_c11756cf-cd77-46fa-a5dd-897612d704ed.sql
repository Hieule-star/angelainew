-- Add status and r2_key columns to video_metadata table for presigned URL flow
ALTER TABLE public.video_metadata 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS r2_key TEXT;

-- Create index for status column for faster queries
CREATE INDEX IF NOT EXISTS idx_video_metadata_status ON public.video_metadata(status);