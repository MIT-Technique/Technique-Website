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

-- 5. Drop auth_provider column (never queried, only set on creation)
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_provider;

-- 6. Backfill name for org users from their org tables (scripts didn't set name)
UPDATE public.users u SET name = c.name
FROM public.clubs c WHERE c.user_id = u.id AND (u.name IS NULL OR u.name = '');

UPDATE public.users u SET name = lg.name
FROM public.living_groups lg WHERE lg.user_id = u.id AND (u.name IS NULL OR u.name = '');

UPDATE public.users u SET name = s.name
FROM public.sports s WHERE s.user_id = u.id AND (u.name IS NULL OR u.name = '');

-- 7. Rename 'student' role to 'staph' and update constraint/default
UPDATE public.users SET role = 'staph' WHERE role = 'student';
UPDATE public.users SET is_staph = true WHERE role = 'staph';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY['admin','staph','club','living_group','sports']::text[]));
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'staph';
