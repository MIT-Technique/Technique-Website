-- Remove unused club_sections column from clubs table
ALTER TABLE clubs DROP COLUMN IF EXISTS club_sections;
