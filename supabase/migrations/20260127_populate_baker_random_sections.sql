-- ============================================================
-- Populate Baker and Random Hall Sections
-- ============================================================
-- Purpose: Update Baker House and Random Hall with their sections
-- Date: 2026-01-27
-- Schema: Uses dorm_sections text[] column on living_groups table
-- ============================================================

-- Update Baker House sections (12 sections: 6 floors × 2 sides)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'First West',
  'Second West',
  'Third West',
  'Fourth West',
  'Fifth West',
  'Sixth West',
  'First East',
  'Second East',
  'Third East',
  'Fourth East',
  'Fifth East',
  'Sixth East'
]
WHERE name = 'Baker House';

-- Update Random Hall sections (8 unique sections)
UPDATE public.living_groups
SET dorm_sections = ARRAY[
  'Foo',
  'Destiny',
  'Black Hole',
  'Loop',
  'BMF',
  'Clam',
  'Pecker',
  'Bonfire'
]
WHERE name = 'Random Hall';

-- Verification queries (run these to check):
-- SELECT name, dorm_sections FROM public.living_groups WHERE name IN ('Baker House', 'Random Hall');
