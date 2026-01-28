-- ============================================================
-- Add dorm_sections column to living_groups table
-- ============================================================
-- Purpose: Store section names for living groups (similar to club_sections)
-- Date: 2026-01-27
-- ============================================================

ALTER TABLE public.living_groups
ADD COLUMN IF NOT EXISTS dorm_sections text[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_living_groups_dorm_sections
  ON public.living_groups USING GIN (dorm_sections);
