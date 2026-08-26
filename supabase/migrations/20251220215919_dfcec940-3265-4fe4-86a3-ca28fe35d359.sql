-- Add new columns to api_usage_logs for detailed logging
ALTER TABLE public.api_usage_logs 
ADD COLUMN IF NOT EXISTS request_id TEXT,
ADD COLUMN IF NOT EXISTS pronoun_style TEXT,
ADD COLUMN IF NOT EXISTS message_count INTEGER,
ADD COLUMN IF NOT EXISTS stream_mode BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT;

-- Create index for request_id to enable quick lookup
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_request_id ON public.api_usage_logs(request_id);

-- Create index for pronoun_style for analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_pronoun_style ON public.api_usage_logs(pronoun_style);