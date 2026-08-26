-- Add columns for cached transform URLs
ALTER TABLE video_metadata 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS preview_gif_url TEXT,
ADD COLUMN IF NOT EXISTS resized_urls JSONB DEFAULT '{}';