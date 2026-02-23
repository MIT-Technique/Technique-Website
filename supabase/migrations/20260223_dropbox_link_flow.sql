-- Replace photo upload columns with Dropbox link delivery flow
ALTER TABLE public.hire_requests ADD COLUMN dropbox_link text;
ALTER TABLE public.hire_requests ADD COLUMN link_submitted_at timestamptz;
ALTER TABLE public.hire_requests ADD COLUMN cost_object text;
ALTER TABLE public.hire_requests DROP COLUMN IF EXISTS photo_urls;
ALTER TABLE public.hire_requests DROP COLUMN IF EXISTS photos_submitted_at;
