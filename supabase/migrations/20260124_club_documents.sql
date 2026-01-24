-- Add document storage columns to clubs table
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS document_links text,
ADD COLUMN IF NOT EXISTS document_notes text;

-- Add comment to describe the columns
COMMENT ON COLUMN public.clubs.document_links IS 'Important links stored by club leaders (max 2000 chars)';
COMMENT ON COLUMN public.clubs.document_notes IS 'Private notes for club leaders (max 5000 chars)';

-- test.