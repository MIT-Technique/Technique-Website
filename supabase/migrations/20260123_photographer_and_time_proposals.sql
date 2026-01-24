-- Migration: Photographer Permissions and Time Proposals
-- Created: 2026-01-23
-- Description: Add photographer permission system and bidirectional time scheduling

-- ============================================
-- 1. Photographer Permissions Table
-- ============================================
-- Tracks which users have been approved as photographers (admin-only approval)
-- Photographers are "special staph" with elevated trust

CREATE TABLE IF NOT EXISTS public.photographer_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  is_active boolean DEFAULT false,
  revoked_by uuid REFERENCES public.users(id),
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT photographer_permissions_user_unique UNIQUE (user_id)
);

-- Index for efficient active photographer lookups
CREATE INDEX IF NOT EXISTS idx_photographer_permissions_active
  ON public.photographer_permissions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_photographer_permissions_user
  ON public.photographer_permissions(user_id);

-- ============================================
-- 2. Time Proposals Table
-- ============================================
-- Living groups can propose times for photographers to accept
-- This enables bidirectional scheduling (photographers post times AND LGs propose times)

CREATE TABLE IF NOT EXISTS public.time_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  living_group_id uuid NOT NULL REFERENCES public.living_groups(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL REFERENCES public.users(id),
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  location text,
  notes text,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  accepted_by uuid REFERENCES public.users(id),  -- Photographer who accepts
  accepted_at timestamptz,
  declined_by uuid REFERENCES public.users(id),  -- Photographer who declines (for tracking)
  declined_at timestamptz,
  decline_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_time_proposals_status
  ON public.time_proposals(status);

CREATE INDEX IF NOT EXISTS idx_time_proposals_living_group
  ON public.time_proposals(living_group_id);

CREATE INDEX IF NOT EXISTS idx_time_proposals_date
  ON public.time_proposals(date);

CREATE INDEX IF NOT EXISTS idx_time_proposals_pending
  ON public.time_proposals(status) WHERE status = 'pending';

-- ============================================
-- 3. Update promotion_requests constraint
-- ============================================
-- Add 'photographer_request' as a valid request type

ALTER TABLE public.promotion_requests
  DROP CONSTRAINT IF EXISTS promotion_requests_request_type_check;

ALTER TABLE public.promotion_requests
  ADD CONSTRAINT promotion_requests_request_type_check
  CHECK (request_type::text = ANY (ARRAY['staph_request', 'photographer_request']::text[]));

-- ============================================
-- 4. Comments for documentation
-- ============================================

COMMENT ON TABLE public.photographer_permissions IS
  'Tracks approved photographers. Admin-only approval required. Photographers can post times and accept LG proposals.';

COMMENT ON TABLE public.time_proposals IS
  'Living groups can propose times for photographers to accept. Part of bidirectional scheduling system.';

COMMENT ON COLUMN public.time_proposals.status IS
  'pending = awaiting photographer response, accepted = converted to photoshoot_time, declined = photographer rejected, cancelled = LG withdrew proposal';
