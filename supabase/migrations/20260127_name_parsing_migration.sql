-- ============================================================
-- Member Name Parsing Migration
-- Adds first_name/last_name fields and migrates existing data
-- Date: 2026-01-27
-- ============================================================

-- STEP 1: Add new columns to club_manual_members
ALTER TABLE public.club_manual_members
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- STEP 2: Add new columns to living_group_manual_members
ALTER TABLE public.living_group_manual_members
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- STEP 3: Migrate existing data in club_manual_members
-- Parse "Last, First" format
UPDATE public.club_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ',', 2)),
  last_name = TRIM(SPLIT_PART(name, ',', 1))
WHERE name LIKE '%,%' AND first_name IS NULL;

-- Parse "First Last" format (2 or more words)
UPDATE public.club_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ' ', 1)),
  last_name = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE name LIKE '% %'
  AND name NOT LIKE '%,%'
  AND first_name IS NULL;

-- Handle single names (use as last name, empty first name)
UPDATE public.club_manual_members
SET
  first_name = '',
  last_name = TRIM(name)
WHERE first_name IS NULL AND name IS NOT NULL;

-- STEP 4: Migrate existing data in living_group_manual_members
-- Parse "Last, First" format
UPDATE public.living_group_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ',', 2)),
  last_name = TRIM(SPLIT_PART(name, ',', 1))
WHERE name LIKE '%,%' AND first_name IS NULL;

-- Parse "First Last" format (2 or more words)
UPDATE public.living_group_manual_members
SET
  first_name = TRIM(SPLIT_PART(name, ' ', 1)),
  last_name = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE name LIKE '% %'
  AND name NOT LIKE '%,%'
  AND first_name IS NULL;

-- Handle single names (use as last name, empty first name)
UPDATE public.living_group_manual_members
SET
  first_name = '',
  last_name = TRIM(name)
WHERE first_name IS NULL AND name IS NOT NULL;

-- STEP 5: Make new columns NOT NULL after migration
ALTER TABLE public.club_manual_members
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE public.living_group_manual_members
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- STEP 6: Add indexes for sorting performance
CREATE INDEX IF NOT EXISTS idx_club_manual_members_name
ON public.club_manual_members(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_lg_manual_members_name
ON public.living_group_manual_members(last_name, first_name);

-- STEP 7: Keep 'name' column for now as backup
-- Can be dropped in a future migration after confirming everything works
-- To drop later:
-- ALTER TABLE public.club_manual_members DROP COLUMN IF EXISTS name;
-- ALTER TABLE public.living_group_manual_members DROP COLUMN IF EXISTS name;
