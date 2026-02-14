-- Migration: Add photographer assignment to photoshoot_times
-- Run this against your Supabase database to enable photographer assignment feature

-- Add columns for photographer assignment
ALTER TABLE public.photoshoot_times
ADD COLUMN IF NOT EXISTS photographer_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS photographer_assigned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS photographer_assigned_by uuid REFERENCES public.users(id);

-- Create index for faster lookups by photographer
CREATE INDEX IF NOT EXISTS idx_photoshoot_times_photographer_id ON public.photoshoot_times(photographer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.photoshoot_times.photographer_id IS 'The photographer assigned to this photoshoot';
COMMENT ON COLUMN public.photoshoot_times.photographer_assigned_at IS 'When the photographer was assigned';
COMMENT ON COLUMN public.photoshoot_times.photographer_assigned_by IS 'Admin who assigned the photographer';
