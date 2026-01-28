-- ============================================================
-- Insert Living Groups with Sections
-- ============================================================
-- Purpose: Create living groups with their sections directly
-- Date: 2026-01-27
-- ============================================================

-- Step 1: Add unique constraint on user_id if it doesn't exist
ALTER TABLE public.living_groups
ADD CONSTRAINT living_groups_user_id_unique UNIQUE (user_id);

-- Step 2: Insert user accounts for each living group (if they don't exist)
INSERT INTO public.users (email, role, first_name, last_name, auth_provider)
VALUES
  ('baker@mit.edu', 'living_group', 'Baker', 'House', 'supabase_auth'),
  ('random@mit.edu', 'living_group', 'Random', 'Hall', 'supabase_auth'),
  ('burton-conner@mit.edu', 'living_group', 'Burton-Conner', 'House', 'supabase_auth'),
  ('east-campus@mit.edu', 'living_group', 'East', 'Campus', 'supabase_auth'),
  ('macgregor@mit.edu', 'living_group', 'MacGregor', 'House', 'supabase_auth'),
  ('maseeh@mit.edu', 'living_group', 'Maseeh', 'Hall', 'supabase_auth'),
  ('mccormick@mit.edu', 'living_group', 'McCormick', 'Hall', 'supabase_auth'),
  ('new-house@mit.edu', 'living_group', 'New', 'House', 'supabase_auth'),
  ('new-vassar@mit.edu', 'living_group', 'New', 'Vassar', 'supabase_auth'),
  ('next@mit.edu', 'living_group', 'Next', 'House', 'supabase_auth'),
  ('simmons@mit.edu', 'living_group', 'Simmons', 'Hall', 'supabase_auth')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Insert the living groups with their sections

-- Baker House
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'Baker House',
  'dorm',
  'active',
  ARRAY[
    'First West', 'Second West', 'Third West', 'Fourth West', 'Fifth West', 'Sixth West',
    'First East', 'Second East', 'Third East', 'Fourth East', 'Fifth East', 'Sixth East'
  ]
FROM public.users u
WHERE u.email = 'baker@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- Random Hall
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'Random Hall',
  'dorm',
  'active',
  ARRAY['Foo', 'Destiny', 'Black Hole', 'Loop', 'BMF', 'Clam', 'Pecker', 'Bonfire']
FROM public.users u
WHERE u.email = 'random@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- Burton-Conner House
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'Burton-Conner House',
  'dorm',
  'active',
  ARRAY['Burton 1', 'Burton 2', 'Burton 3', 'Burton 4', 'Burton 5', 'Conner 2', 'Conner 3', 'Conner 4', 'Conner 5']
FROM public.users u
WHERE u.email = 'burton-conner@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- East Campus
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'East Campus',
  'dorm',
  'active',
  ARRAY['First West', 'Second West', 'Third West', 'Fourth (Forty-one) West', 'Fifth West', 'First East', 'Second East', 'Third East', 'Fourth East', 'Fifth East']
FROM public.users u
WHERE u.email = 'east-campus@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- MacGregor House
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'MacGregor House',
  'dorm',
  'active',
  ARRAY['A Entry', 'B Entry', 'C Entry', 'D Entry', 'E Entry', 'F Entry', 'G Entry', 'H Entry', 'J Entry']
FROM public.users u
WHERE u.email = 'macgregor@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- Maseeh Hall
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'Maseeh Hall',
  'dorm',
  'active',
  ARRAY['1', '2', '3', '4', '5', '6', '7']
FROM public.users u
WHERE u.email = 'maseeh@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- McCormick Hall
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'McCormick Hall',
  'dorm',
  'active',
  ARRAY[
    'East Tower 1', 'East Tower 2', 'East Tower 3', 'East Tower 4', 'East Tower 5', 'East Tower 6', 'East Tower 7',
    'West Tower 1', 'West Tower 2', 'West Tower 3', 'West Tower 4', 'West Tower 5', 'West Tower 6', 'West Tower 7',
    'The Annex'
  ]
FROM public.users u
WHERE u.email = 'mccormick@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- New House
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'New House',
  'dorm',
  'active',
  ARRAY['Chocolate City', 'French House', 'German House', 'House 3', 'House 4', 'House 5 (Desmond)', 'iHouse', 'Juniper', 'La Casa']
FROM public.users u
WHERE u.email = 'new-house@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- New Vassar
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'New Vassar',
  'dorm',
  'active',
  ARRAY['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C']
FROM public.users u
WHERE u.email = 'new-vassar@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- Next House
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'Next House',
  'dorm',
  'active',
  ARRAY['2 West', '2 East', '3 West', '3 East', '4 West', '4 East', '5 West', '5 East']
FROM public.users u
WHERE u.email = 'next@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- Simmons Hall
INSERT INTO public.living_groups (user_id, name, living_group_type, status, dorm_sections)
SELECT
  u.id,
  'Simmons Hall',
  'dorm',
  'active',
  ARRAY['2A', '2B', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '5C', '6A', '6B', '6C', '7A', '7B', '7C', '8B']
FROM public.users u
WHERE u.email = 'simmons@mit.edu'
ON CONFLICT (user_id) DO UPDATE
SET dorm_sections = EXCLUDED.dorm_sections,
    name = EXCLUDED.name;

-- Verification: Show all living groups with their sections
SELECT
  lg.name,
  u.email as user_email,
  lg.status,
  lg.dorm_sections,
  array_length(lg.dorm_sections, 1) as section_count
FROM public.living_groups lg
JOIN public.users u ON u.id = lg.user_id
ORDER BY lg.name;
