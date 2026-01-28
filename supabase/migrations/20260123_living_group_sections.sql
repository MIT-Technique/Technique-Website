-- ============================================================
-- Living Group Sections & Membership Migration
-- ============================================================
-- Purpose: Set up sections for living groups using text[] arrays
-- Date: 2026-01-23 (Updated: 2026-01-27)
-- Schema: Matches CLAUDE.md - uses dorm_sections text[] on living_groups
-- ============================================================

-- 1. Add dorm_sections column to living_groups table (if not exists)
ALTER TABLE public.living_groups
ADD COLUMN IF NOT EXISTS dorm_sections text[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_living_groups_dorm_sections
  ON public.living_groups USING GIN (dorm_sections);

-- 2. Ensure living_group_type exists (should already exist from schema)
-- This column distinguishes between dorms and FSILGs
ALTER TABLE public.living_groups
ADD COLUMN IF NOT EXISTS living_group_type character varying DEFAULT 'dorm'
CHECK (living_group_type IN ('dorm', 'fsilg'));

-- 3. Add section_name to living_group_manual_members (if not exists)
-- This allows manual members to be assigned to sections
ALTER TABLE public.living_group_manual_members
ADD COLUMN IF NOT EXISTS section_name text;

-- 4. Update living_group_memberships to include section_name (if not exists)
-- This allows registered users to be assigned to sections
ALTER TABLE public.living_group_memberships
ADD COLUMN IF NOT EXISTS section_name text;

-- ============================================================
-- SEED DATA: Living Group Sections (as text arrays)
-- ============================================================

-- Baker House (12 sections: 6 floors × 2 sides)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'First West', 'Second West', 'Third West', 'Fourth West', 'Fifth West', 'Sixth West',
  'First East', 'Second East', 'Third East', 'Fourth East', 'Fifth East', 'Sixth East'
]
WHERE name = 'Baker House';

-- Burton-Conner House (9 sections: Burton 1-5, Conner 2-5)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Burton 1', 'Burton 2', 'Burton 3', 'Burton 4', 'Burton 5',
  'Conner 2', 'Conner 3', 'Conner 4', 'Conner 5'
]
WHERE name = 'Burton-Conner House';

-- East Campus (10 halls: 5 floors × 2 sides)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'First West', 'Second West', 'Third West', 'Fourth (Forty-one) West', 'Fifth West',
  'First East', 'Second East', 'Third East', 'Fourth East', 'Fifth East'
]
WHERE name = 'East Campus';

-- MacGregor House (9 entries: A-H, J)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'A Entry', 'B Entry', 'C Entry', 'D Entry', 'E Entry',
  'F Entry', 'G Entry', 'H Entry', 'J Entry'
]
WHERE name = 'MacGregor House' OR name = 'Macgregor House';

-- Maseeh Hall (7 floors)
UPDATE public.living_groups
SET dorm_sections = ARRAY['1', '2', '3', '4', '5', '6', '7']
WHERE name = 'Maseeh Hall';

-- McCormick Hall (15 sections: East Tower 1-7, West Tower 1-7, The Annex)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'East Tower 1', 'East Tower 2', 'East Tower 3', 'East Tower 4',
  'East Tower 5', 'East Tower 6', 'East Tower 7',
  'West Tower 1', 'West Tower 2', 'West Tower 3', 'West Tower 4',
  'West Tower 5', 'West Tower 6', 'West Tower 7',
  'The Annex'
]
WHERE name = 'McCormick Hall';

-- New House (9 houses)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Chocolate City', 'French House', 'German House',
  'House 3', 'House 4', 'House 5 (Desmond)',
  'iHouse', 'Juniper', 'La Casa'
]
WHERE name = 'New House';

-- New Vassar (12 sections: 4 floors × 3 sections A/B/C)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  '1A', '1B', '1C', '2A', '2B', '2C',
  '3A', '3B', '3C', '4A', '4B', '4C'
]
WHERE name = 'New Vassar';

-- Next House (8 wings: 4 floors × 2 sides)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  '2 West', '2 East', '3 West', '3 East',
  '4 West', '4 East', '5 West', '5 East'
]
WHERE name = 'Next House';

-- Random Hall (8 unique sections)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Foo', 'Destiny', 'Black Hole', 'Loop',
  'BMF', 'Clam', 'Pecker', 'Bonfire'
]
WHERE name = 'Random Hall';

-- Simmons Hall (18 sections: various towers/floors)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  '2A', '2B', '3A', '3B', '3C', '4A', '4B', '4C',
  '5A', '5B', '5C', '6A', '6B', '6C', '7A', '7B', '7C', '8B'
]
WHERE name = 'Simmons Hall';

-- ============================================================
-- Verification Queries
-- ============================================================
-- Run these to check the migration:
-- SELECT name, dorm_sections, array_length(dorm_sections, 1) as section_count
-- FROM public.living_groups
-- WHERE dorm_sections IS NOT NULL AND array_length(dorm_sections, 1) > 0
-- ORDER BY name;
