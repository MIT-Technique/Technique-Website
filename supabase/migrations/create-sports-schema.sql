-- ============================================
-- Sports Schema Migration
-- Creates tables, storage bucket, form setting,
-- and updates user role constraint.
-- ============================================

-- 1. Update users role constraint to include 'sports'
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role::text = ANY (ARRAY['admin', 'staph', 'club', 'living_group', 'student', 'sports']));

-- 2. Create sports table
CREATE TABLE IF NOT EXISTS public.sports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name character varying NOT NULL UNIQUE,
    description text,
    has_gender_teams boolean DEFAULT false,

    -- Shared/default team data (used when has_gender_teams = false)
    achievement_summary text,
    candid_image_1 text,
    candid_image_2 text,
    candid_image_3 text,

    -- Men's team data (used when has_gender_teams = true)
    mens_achievement_summary text,
    mens_candid_image_1 text,
    mens_candid_image_2 text,
    mens_candid_image_3 text,

    -- Women's team data (used when has_gender_teams = true)
    womens_achievement_summary text,
    womens_candid_image_1 text,
    womens_candid_image_2 text,
    womens_candid_image_3 text,

    -- Documents (shared)
    document_links text,
    document_notes text,

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    CONSTRAINT sports_pkey PRIMARY KEY (id),
    CONSTRAINT sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_sports_user_id ON public.sports(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_name ON public.sports(name);

-- 3. Create sports_coaches table
CREATE TABLE IF NOT EXISTS public.sports_coaches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sports_id uuid NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    display_order integer DEFAULT 0,
    added_at timestamp with time zone DEFAULT now(),

    CONSTRAINT sports_coaches_pkey PRIMARY KEY (id),
    CONSTRAINT sports_coaches_sports_id_fkey FOREIGN KEY (sports_id)
        REFERENCES public.sports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sports_coaches_sports_id ON public.sports_coaches(sports_id);

-- 4. Create sports_manual_members table
CREATE TABLE IF NOT EXISTS public.sports_manual_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sports_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    name text NOT NULL,
    team text,
    added_at timestamp with time zone DEFAULT now(),

    CONSTRAINT sports_manual_members_pkey PRIMARY KEY (id),
    CONSTRAINT sports_manual_members_sports_id_fkey FOREIGN KEY (sports_id)
        REFERENCES public.sports(id) ON DELETE CASCADE,
    CONSTRAINT sports_manual_members_team_check
        CHECK (team IS NULL OR team IN ('mens', 'womens'))
);

CREATE INDEX IF NOT EXISTS idx_sports_manual_members_sports_id ON public.sports_manual_members(sports_id);
CREATE INDEX IF NOT EXISTS idx_sports_manual_members_team ON public.sports_manual_members(team);

-- 5. Add form setting for sports
INSERT INTO public.form_settings (form_name, is_frozen)
VALUES ('sports_form', false)
ON CONFLICT (form_name) DO NOTHING;

-- 6. Create storage bucket for sports images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('sports-images', 'sports-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS policies for sports tables
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_manual_members ENABLE ROW LEVEL SECURITY;

-- Sports: allow all reads (for public pages), owner can update
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports' AND policyname = 'sports_select_all') THEN
  CREATE POLICY sports_select_all ON public.sports FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports' AND policyname = 'sports_update_own') THEN
  CREATE POLICY sports_update_own ON public.sports FOR UPDATE USING (user_id = auth.uid());
END IF;
END $$;

-- Sports coaches: allow all reads, owner can insert/update/delete
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_coaches' AND policyname = 'sports_coaches_select_all') THEN
  CREATE POLICY sports_coaches_select_all ON public.sports_coaches FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_coaches' AND policyname = 'sports_coaches_insert_own') THEN
  CREATE POLICY sports_coaches_insert_own ON public.sports_coaches FOR INSERT
    WITH CHECK (sports_id IN (SELECT id FROM public.sports WHERE user_id = auth.uid()));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_coaches' AND policyname = 'sports_coaches_update_own') THEN
  CREATE POLICY sports_coaches_update_own ON public.sports_coaches FOR UPDATE
    USING (sports_id IN (SELECT id FROM public.sports WHERE user_id = auth.uid()));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_coaches' AND policyname = 'sports_coaches_delete_own') THEN
  CREATE POLICY sports_coaches_delete_own ON public.sports_coaches FOR DELETE
    USING (sports_id IN (SELECT id FROM public.sports WHERE user_id = auth.uid()));
END IF;
END $$;

-- Sports manual members: same pattern
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_manual_members' AND policyname = 'sports_members_select_all') THEN
  CREATE POLICY sports_members_select_all ON public.sports_manual_members FOR SELECT USING (true);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_manual_members' AND policyname = 'sports_members_insert_own') THEN
  CREATE POLICY sports_members_insert_own ON public.sports_manual_members FOR INSERT
    WITH CHECK (sports_id IN (SELECT id FROM public.sports WHERE user_id = auth.uid()));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_manual_members' AND policyname = 'sports_members_update_own') THEN
  CREATE POLICY sports_members_update_own ON public.sports_manual_members FOR UPDATE
    USING (sports_id IN (SELECT id FROM public.sports WHERE user_id = auth.uid()));
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sports_manual_members' AND policyname = 'sports_members_delete_own') THEN
  CREATE POLICY sports_members_delete_own ON public.sports_manual_members FOR DELETE
    USING (sports_id IN (SELECT id FROM public.sports WHERE user_id = auth.uid()));
END IF;
END $$;

-- Storage policies for sports-images bucket
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'sports_images_select') THEN
  CREATE POLICY sports_images_select ON storage.objects FOR SELECT
    USING (bucket_id = 'sports-images');
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'sports_images_insert') THEN
  CREATE POLICY sports_images_insert ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'sports-images');
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'sports_images_update') THEN
  CREATE POLICY sports_images_update ON storage.objects FOR UPDATE
    USING (bucket_id = 'sports-images');
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'sports_images_delete') THEN
  CREATE POLICY sports_images_delete ON storage.objects FOR DELETE
    USING (bucket_id = 'sports-images');
END IF;
END $$;
