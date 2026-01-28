-- ============================================================
-- Section Assignment Feature - Database Migration
-- ============================================================
-- Purpose: Create table for assigning living group sections to time slots
-- Date: 2026-01-27
-- ============================================================

CREATE TABLE IF NOT EXISTS public.living_group_time_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  photoshoot_time_id uuid NOT NULL,
  living_group_id uuid NOT NULL,
  section_name text, -- Can be NULL for unassigned slots
  slot_start time without time zone NOT NULL, -- Must be XX:00 or XX:30
  slot_end time without time zone NOT NULL, -- Must be XX:00 or XX:30
  assigned_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT living_group_time_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT living_group_time_assignments_photoshoot_fkey
    FOREIGN KEY (photoshoot_time_id) REFERENCES public.photoshoot_times(id) ON DELETE CASCADE,
  CONSTRAINT living_group_time_assignments_living_group_fkey
    FOREIGN KEY (living_group_id) REFERENCES public.living_groups(id) ON DELETE CASCADE,
  CONSTRAINT living_group_time_assignments_assigned_by_fkey
    FOREIGN KEY (assigned_by) REFERENCES public.users(id),

  -- Unique constraint: only one assignment per slot per photoshoot
  CONSTRAINT living_group_time_assignments_unique
    UNIQUE (photoshoot_time_id, slot_start, slot_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lgta_photoshoot
  ON public.living_group_time_assignments(photoshoot_time_id);
CREATE INDEX IF NOT EXISTS idx_lgta_living_group
  ON public.living_group_time_assignments(living_group_id);
CREATE INDEX IF NOT EXISTS idx_lgta_section
  ON public.living_group_time_assignments(section_name);

-- Enable RLS
ALTER TABLE public.living_group_time_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view assignments for their living group
CREATE POLICY "Users can view their LG time assignments"
ON public.living_group_time_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.living_groups lg
    JOIN public.users u ON u.id = lg.user_id
    WHERE lg.id = living_group_time_assignments.living_group_id
    AND u.supabase_auth_id = auth.uid()
  )
);

-- RLS Policy: Admins can view all assignments
CREATE POLICY "Admins can view all time assignments"
ON public.living_group_time_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid()
    AND (u.role = 'admin' OR u.is_staph = true)
  )
);

-- RLS Policy: Users can insert assignments for their living group
CREATE POLICY "Users can create time assignments for their LG"
ON public.living_group_time_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.living_groups lg
    JOIN public.users u ON u.id = lg.user_id
    WHERE lg.id = living_group_time_assignments.living_group_id
    AND u.supabase_auth_id = auth.uid()
  )
);

-- RLS Policy: Admins can insert any assignment
CREATE POLICY "Admins can create any time assignment"
ON public.living_group_time_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid()
    AND (u.role = 'admin' OR u.is_staph = true)
  )
);

-- RLS Policy: Users can update assignments for their living group
CREATE POLICY "Users can update time assignments for their LG"
ON public.living_group_time_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.living_groups lg
    JOIN public.users u ON u.id = lg.user_id
    WHERE lg.id = living_group_time_assignments.living_group_id
    AND u.supabase_auth_id = auth.uid()
  )
);

-- RLS Policy: Admins can update any assignment
CREATE POLICY "Admins can update any time assignment"
ON public.living_group_time_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid()
    AND (u.role = 'admin' OR u.is_staph = true)
  )
);

-- RLS Policy: Users can delete assignments for their living group
CREATE POLICY "Users can delete time assignments for their LG"
ON public.living_group_time_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.living_groups lg
    JOIN public.users u ON u.id = lg.user_id
    WHERE lg.id = living_group_time_assignments.living_group_id
    AND u.supabase_auth_id = auth.uid()
  )
);

-- RLS Policy: Admins can delete any assignment
CREATE POLICY "Admins can delete any time assignment"
ON public.living_group_time_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid()
    AND (u.role = 'admin' OR u.is_staph = true)
  )
);
