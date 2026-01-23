-- Migration: Club Invitations System
-- Date: 2026-01-22
-- Description: Adds has_leader column to clubs and creates club_invitations table

-- Add has_leader column to clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS has_leader boolean DEFAULT false;

-- Update existing clubs that have leaders
UPDATE public.clubs c
SET has_leader = true
WHERE EXISTS (
  SELECT 1 FROM public.club_memberships cm
  WHERE cm.club_id = c.id AND cm.role = 'leader'
);

-- Create club_invitations table
CREATE TABLE IF NOT EXISTS public.club_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT club_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT club_invitations_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE,
  CONSTRAINT club_invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT club_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT club_invitations_unique UNIQUE (club_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_club_invitations_user_status
ON public.club_invitations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_club_invitations_club_status
ON public.club_invitations(club_id, status);

-- Comment on table
COMMENT ON TABLE public.club_invitations IS 'Stores club-to-student invitations. Students can accept or decline.';
COMMENT ON COLUMN public.club_invitations.invited_by IS 'The user (club account or leader) who sent the invitation';
