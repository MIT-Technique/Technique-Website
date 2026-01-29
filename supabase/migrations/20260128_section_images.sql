-- Add section_images JSONB column to living_groups
-- Stores mapping of section name -> image URL, e.g. {"Floor 1": "https://..."}
ALTER TABLE living_groups ADD COLUMN IF NOT EXISTS section_images jsonb DEFAULT '{}'::jsonb;
