-- Migration: Add access array + consolidate first_name/last_name into name
-- Run this in Supabase SQL editor BEFORE deploying the code changes.

-- 1. Add access column to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS access text[] DEFAULT '{}';

-- 2. Consolidate first_name/last_name → name on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;
UPDATE public.users SET name = TRIM(CONCAT_WS(' ', first_name, last_name)) WHERE name IS NULL;
ALTER TABLE public.users DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS last_name;

-- 3. Consolidate first_name/last_name → name on senior_bios
ALTER TABLE public.senior_bios ADD COLUMN IF NOT EXISTS name text;
UPDATE public.senior_bios SET name = TRIM(CONCAT_WS(' ', first_name, last_name)) WHERE name IS NULL;
ALTER TABLE public.senior_bios DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.senior_bios DROP COLUMN IF EXISTS last_name;

-- 4. Drop first_name/last_name from manual member tables (they already have `name`)
ALTER TABLE public.club_manual_members DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.club_manual_members DROP COLUMN IF EXISTS last_name;

ALTER TABLE public.living_group_manual_members DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.living_group_manual_members DROP COLUMN IF EXISTS last_name;

ALTER TABLE public.sports_manual_members DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.sports_manual_members DROP COLUMN IF EXISTS last_name;
