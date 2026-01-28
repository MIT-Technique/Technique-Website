-- ============================================================
-- Check and Update Living Group Sections
-- ============================================================
-- Purpose: Flexible migration that matches partial names
-- Date: 2026-01-27
-- ============================================================

-- First, let's see what living groups exist:
-- SELECT id, name, dorm_sections FROM public.living_groups ORDER BY name;

-- Update Baker (matches "Baker", "Baker House", etc.)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'First West', 'Second West', 'Third West', 'Fourth West', 'Fifth West', 'Sixth West',
  'First East', 'Second East', 'Third East', 'Fourth East', 'Fifth East', 'Sixth East'
]
WHERE name ILIKE '%baker%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update Random (matches "Random", "Random Hall", etc.)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Foo', 'Destiny', 'Black Hole', 'Loop',
  'BMF', 'Clam', 'Pecker', 'Bonfire'
]
WHERE name ILIKE '%random%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update Burton-Conner
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Burton 1', 'Burton 2', 'Burton 3', 'Burton 4', 'Burton 5',
  'Conner 2', 'Conner 3', 'Conner 4', 'Conner 5'
]
WHERE (name ILIKE '%burton%' OR name ILIKE '%conner%')
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update East Campus
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'First West', 'Second West', 'Third West', 'Fourth (Forty-one) West', 'Fifth West',
  'First East', 'Second East', 'Third East', 'Fourth East', 'Fifth East'
]
WHERE (name ILIKE '%east campus%' OR name ILIKE 'east%')
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update MacGregor
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'A Entry', 'B Entry', 'C Entry', 'D Entry', 'E Entry',
  'F Entry', 'G Entry', 'H Entry', 'J Entry'
]
WHERE name ILIKE '%macgregor%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update Maseeh
UPDATE public.living_groups
SET dorm_sections = ARRAY['1', '2', '3', '4', '5', '6', '7']
WHERE name ILIKE '%maseeh%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update McCormick
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'East Tower 1', 'East Tower 2', 'East Tower 3', 'East Tower 4',
  'East Tower 5', 'East Tower 6', 'East Tower 7',
  'West Tower 1', 'West Tower 2', 'West Tower 3', 'West Tower 4',
  'West Tower 5', 'West Tower 6', 'West Tower 7',
  'The Annex'
]
WHERE name ILIKE '%mccormick%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update New House
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Chocolate City', 'French House', 'German House',
  'House 3', 'House 4', 'House 5 (Desmond)',
  'iHouse', 'Juniper', 'La Casa'
]
WHERE name ILIKE '%new house%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update New Vassar
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  '1A', '1B', '1C', '2A', '2B', '2C',
  '3A', '3B', '3C', '4A', '4B', '4C'
]
WHERE name ILIKE '%new vassar%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update Next House
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  '2 West', '2 East', '3 West', '3 East',
  '4 West', '4 East', '5 West', '5 East'
]
WHERE name ILIKE '%next%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Update Simmons
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  '2A', '2B', '3A', '3B', '3C', '4A', '4B', '4C',
  '5A', '5B', '5C', '6A', '6B', '6C', '7A', '7B', '7C', '8B'
]
WHERE name ILIKE '%simmons%'
  AND (dorm_sections IS NULL OR array_length(dorm_sections, 1) IS NULL OR dorm_sections = '{}');

-- Verification: Check what was updated
SELECT
  name,
  dorm_sections,
  array_length(dorm_sections, 1) as section_count
FROM public.living_groups
ORDER BY name;
