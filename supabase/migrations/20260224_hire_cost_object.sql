-- Add optional cost_object column to hire_requests
ALTER TABLE public.hire_requests
  ADD COLUMN IF NOT EXISTS cost_object text;

-- Store the claim email Message-ID for threading delivery emails as replies
ALTER TABLE public.hire_requests
  ADD COLUMN IF NOT EXISTS claim_email_message_id text;
