-- ============================================================
-- Migration: Move dorm_sections from table to column
-- Run this in Supabase SQL Editor AFTER the previous migration
-- ============================================================

-- 1. Add dorm_sections column to living_groups table (text array)
ALTER TABLE public.living_groups
ADD COLUMN IF NOT EXISTS dorm_sections text[] DEFAULT '{}';

-- 2. Populate dorm_sections for each living group from the dorm_sections table
-- This aggregates section names into an array for each dorm
UPDATE public.living_groups lg
SET dorm_sections = COALESCE(
  (
    SELECT ARRAY_AGG(ds.section_name ORDER BY ds.display_order)
    FROM public.dorm_sections ds
    WHERE ds.dorm_name = lg.name
  ),
  '{}'
);

-- 3. Change living_group_memberships: add section_name column and migrate data
ALTER TABLE public.living_group_memberships
ADD COLUMN IF NOT EXISTS section_name text;

-- Migrate section_id to section_name
UPDATE public.living_group_memberships lgm
SET section_name = ds.section_name
FROM public.dorm_sections ds
WHERE lgm.section_id = ds.id;

-- Drop the foreign key constraint and section_id column
ALTER TABLE public.living_group_memberships
DROP CONSTRAINT IF EXISTS living_group_memberships_section_fkey;

ALTER TABLE public.living_group_memberships
DROP COLUMN IF EXISTS section_id;

-- Drop the index on section_id
DROP INDEX IF EXISTS idx_lgm_section;

-- 4. Change living_group_time_assignments: add section_name column and migrate data
ALTER TABLE public.living_group_time_assignments
ADD COLUMN IF NOT EXISTS section_name text;

-- Migrate section_id to section_name
UPDATE public.living_group_time_assignments lgta
SET section_name = ds.section_name
FROM public.dorm_sections ds
WHERE lgta.section_id = ds.id;

-- Drop the foreign key constraint and section_id column
ALTER TABLE public.living_group_time_assignments
DROP CONSTRAINT IF EXISTS living_group_time_assignments_section_id_fkey;

ALTER TABLE public.living_group_time_assignments
DROP COLUMN IF EXISTS section_id;

-- 5. Change section_expected_counts: add section_name column and migrate data
ALTER TABLE public.section_expected_counts
ADD COLUMN IF NOT EXISTS section_name text;

-- Migrate section_id to section_name
UPDATE public.section_expected_counts sec
SET section_name = ds.section_name
FROM public.dorm_sections ds
WHERE sec.section_id = ds.id;

-- Drop the foreign key constraint and section_id column
ALTER TABLE public.section_expected_counts
DROP CONSTRAINT IF EXISTS section_expected_counts_section_fkey;

ALTER TABLE public.section_expected_counts
DROP COLUMN IF EXISTS section_id;

-- Update unique constraint
ALTER TABLE public.section_expected_counts
DROP CONSTRAINT IF EXISTS section_expected_counts_unique;

ALTER TABLE public.section_expected_counts
ADD CONSTRAINT section_expected_counts_unique UNIQUE (living_group_id, section_name);

-- 6. Drop the dorm_sections table (we no longer need it)
DROP TABLE IF EXISTS public.dorm_sections CASCADE;

-- ============================================================
-- Verification
-- ============================================================
-- Run these to verify:
-- SELECT name, dorm_sections FROM public.living_groups WHERE dorm_sections != '{}';
-- SELECT COUNT(*) FROM public.living_group_memberships WHERE section_name IS NOT NULL;
