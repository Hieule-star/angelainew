-- Allow r2_url to be NULL for pending records
ALTER TABLE video_metadata 
ALTER COLUMN r2_url DROP NOT NULL;