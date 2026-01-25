-- ============================================================
-- Living Group Sections & Student Membership Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add living_group_type column to living_groups table
ALTER TABLE public.living_groups
ADD COLUMN IF NOT EXISTS living_group_type character varying DEFAULT 'dorm'
CHECK (living_group_type IN ('dorm', 'fsilg'));

-- 2. Create dorm_sections table
CREATE TABLE IF NOT EXISTS public.dorm_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dorm_name character varying NOT NULL,
  section_name character varying NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dorm_sections_pkey PRIMARY KEY (id),
  CONSTRAINT dorm_sections_unique UNIQUE (dorm_name, section_name)
);

-- Index for fast lookups by dorm
CREATE INDEX IF NOT EXISTS idx_dorm_sections_dorm_name ON public.dorm_sections(dorm_name);

-- 3. Create living_group_memberships table
CREATE TABLE IF NOT EXISTS public.living_group_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  living_group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  section_id uuid,
  membership_type character varying NOT NULL CHECK (membership_type IN ('dorm', 'fsilg')),
  status character varying NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at timestamp with time zone DEFAULT now(),
  approved_by uuid,
  approved_at timestamp with time zone,
  CONSTRAINT living_group_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT living_group_memberships_living_group_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id) ON DELETE CASCADE,
  CONSTRAINT living_group_memberships_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT living_group_memberships_section_fkey FOREIGN KEY (section_id) REFERENCES public.dorm_sections(id),
  CONSTRAINT living_group_memberships_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);

-- Indexes for living_group_memberships
CREATE INDEX IF NOT EXISTS idx_lgm_living_group ON public.living_group_memberships(living_group_id);
CREATE INDEX IF NOT EXISTS idx_lgm_user ON public.living_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_lgm_section ON public.living_group_memberships(section_id);
CREATE INDEX IF NOT EXISTS idx_lgm_status ON public.living_group_memberships(status);

-- Unique constraint: One dorm membership per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_dorm_per_user
ON public.living_group_memberships(user_id)
WHERE membership_type = 'dorm' AND status = 'active';

-- Unique constraint: One FSILG membership per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_fsilg_per_user
ON public.living_group_memberships(user_id)
WHERE membership_type = 'fsilg' AND status = 'active';

-- 4. Create section_expected_counts table
CREATE TABLE IF NOT EXISTS public.section_expected_counts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  living_group_id uuid NOT NULL,
  section_id uuid,
  expected_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT section_expected_counts_pkey PRIMARY KEY (id),
  CONSTRAINT section_expected_counts_lg_fkey FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id) ON DELETE CASCADE,
  CONSTRAINT section_expected_counts_section_fkey FOREIGN KEY (section_id) REFERENCES public.dorm_sections(id),
  CONSTRAINT section_expected_counts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id),
  CONSTRAINT section_expected_counts_unique UNIQUE (living_group_id, section_id)
);

-- 5. Enable RLS on new tables
ALTER TABLE public.dorm_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.living_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_expected_counts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for dorm_sections (read-only for everyone)
CREATE POLICY "Anyone can view dorm sections"
ON public.dorm_sections FOR SELECT
TO authenticated
USING (true);

-- 7. RLS Policies for living_group_memberships
CREATE POLICY "Users can view their own memberships"
ON public.living_group_memberships FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.supabase_auth_id = auth.uid()
  AND u.id = living_group_memberships.user_id
));

CREATE POLICY "Living group leaders can view their members"
ON public.living_group_memberships FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.living_groups lg
  JOIN public.users u ON u.id = lg.user_id
  WHERE lg.id = living_group_memberships.living_group_id
  AND u.supabase_auth_id = auth.uid()
));

CREATE POLICY "Admins can view all memberships"
ON public.living_group_memberships FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.supabase_auth_id = auth.uid()
  AND u.role IN ('admin', 'staph')
));

-- 8. RLS Policies for section_expected_counts
CREATE POLICY "Anyone authenticated can view expected counts"
ON public.section_expected_counts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Living group leaders can update their expected counts"
ON public.section_expected_counts FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.living_groups lg
  JOIN public.users u ON u.id = lg.user_id
  WHERE lg.id = section_expected_counts.living_group_id
  AND u.supabase_auth_id = auth.uid()
));

-- ============================================================
-- SEED DATA: Dorm Sections
-- ============================================================

-- Baker House (5 floors)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Baker House', 'Floor 1', 1),
('Baker House', 'Floor 2', 2),
('Baker House', 'Floor 3', 3),
('Baker House', 'Floor 4', 4),
('Baker House', 'Floor 5', 5)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- Burton-Conner House (9 sections: Burton 1-5, Conner 2-5, no Conner 1)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Burton-Conner House', 'Burton 1', 1),
('Burton-Conner House', 'Burton 2', 2),
('Burton-Conner House', 'Burton 3', 3),
('Burton-Conner House', 'Burton 4', 4),
('Burton-Conner House', 'Burton 5', 5),
('Burton-Conner House', 'Conner 2', 6),
('Burton-Conner House', 'Conner 3', 7),
('Burton-Conner House', 'Conner 4', 8),
('Burton-Conner House', 'Conner 5', 9)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- East Campus (10 halls: 5 floors × 2 sides)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('East Campus', '1st East', 1),
('East Campus', '1st West', 2),
('East Campus', '2nd East', 3),
('East Campus', '2nd West', 4),
('East Campus', '3rd East', 5),
('East Campus', '3rd West', 6),
('East Campus', '4th East', 7),
('East Campus', '4th West', 8),
('East Campus', '5th East', 9),
('East Campus', '5th West', 10)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- MacGregor House (9 entries: A-H, J - no I)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Macgregor House', 'A Entry', 1),
('Macgregor House', 'B Entry', 2),
('Macgregor House', 'C Entry', 3),
('Macgregor House', 'D Entry', 4),
('Macgregor House', 'E Entry', 5),
('Macgregor House', 'F Entry', 6),
('Macgregor House', 'G Entry', 7),
('Macgregor House', 'H Entry', 8),
('Macgregor House', 'J Entry', 9)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- Maseeh Hall (8 floors)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Maseeh Hall', 'Floor 1', 1),
('Maseeh Hall', 'Floor 2', 2),
('Maseeh Hall', 'Floor 3', 3),
('Maseeh Hall', 'Floor 4', 4),
('Maseeh Hall', 'Floor 5', 5),
('Maseeh Hall', 'Floor 6', 6),
('Maseeh Hall', 'Floor 7', 7)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- McCormick Hall (East Tower floors 1-8, West Tower floors 1-8)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('McCormick Hall', 'East Tower 1', 1),
('McCormick Hall', 'East Tower 2', 2),
('McCormick Hall', 'East Tower 3', 3),
('McCormick Hall', 'East Tower 4', 4),
('McCormick Hall', 'East Tower 5', 5),
('McCormick Hall', 'East Tower 6', 6),
('McCormick Hall', 'East Tower 7', 7),
('McCormick Hall', 'East Tower 8', 8),
('McCormick Hall', 'West Tower 1', 9),
('McCormick Hall', 'West Tower 2', 10),
('McCormick Hall', 'West Tower 3', 11),
('McCormick Hall', 'West Tower 4', 12),
('McCormick Hall', 'West Tower 5', 13),
('McCormick Hall', 'West Tower 6', 14),
('McCormick Hall', 'West Tower 7', 15),
('McCormick Hall', 'West Tower 8', 16)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- New House (9 Houses)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('New House', 'Chocolate City', 1),
('New House', 'French House', 2),
('New House', 'German House', 3),
('New House', 'House 3', 4),
('New House', 'House 4', 5),
('New House', 'House 5 (Desmond)', 6),
('New House', 'iHouse', 7),
('New House', 'Juniper', 8),
('New House', 'La Casa', 9)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- New Vassar (4 floors × 3 sections: A, B, C)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('New Vassar', 'Floor 1 Section A', 1),
('New Vassar', 'Floor 1 Section B', 2),
('New Vassar', 'Floor 1 Section C', 3),
('New Vassar', 'Floor 2 Section A', 4),
('New Vassar', 'Floor 2 Section B', 5),
('New Vassar', 'Floor 2 Section C', 6),
('New Vassar', 'Floor 3 Section A', 7),
('New Vassar', 'Floor 3 Section B', 8),
('New Vassar', 'Floor 3 Section C', 9),
('New Vassar', 'Floor 4 Section A', 10),
('New Vassar', 'Floor 4 Section B', 11),
('New Vassar', 'Floor 4 Section C', 12)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- Next House (4 wings)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Next House', 'Floor 2 West', 1),
('Next House', 'Floor 2 East', 2),
('Next House', 'Floor 3 West', 3),
('Next House', 'Floor 3 East', 4),
('Next House', 'Floor 4 West', 5),
('Next House', 'Floor 4 East', 6),
('Next House', 'Floor 5 West', 7),
('Next House', 'Floor 5 East', 8)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- Random Hall (3 floors)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Random Hall', 'Foo', 1),
('Random Hall', 'Destiny', 2),
('Random Hall', 'Black Hole', 3),
('Random Hall', 'Loop', 4),
('Random Hall', 'BMF', 5),
('Random Hall', 'Clam', 6),
('Random Hall', 'Pecker', 7),
('Random Hall', 'Bonfire', 8)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- Simmons Hall (3 Towers)
INSERT INTO dorm_sections (dorm_name, section_name, display_order) VALUES
('Simmons Hall', 'Floor 1', 1),
('Simmons Hall', 'Floor 2', 2),
('Simmons Hall', 'Floor 3', 3)
ON CONFLICT (dorm_name, section_name) DO NOTHING;

-- ============================================================
-- Verification: Check created tables
-- ============================================================
-- Run these to verify:
-- SELECT * FROM dorm_sections ORDER BY dorm_name, display_order;
-- SELECT COUNT(*) FROM dorm_sections; -- Should be ~80 sections