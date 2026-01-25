-- Migration: Refactor living_group_leader role to is_living_group_leader boolean
-- This allows students to be LG leaders while keeping their student role

-- 1. Add is_living_group_leader column (default false)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_living_group_leader boolean DEFAULT false;

-- 2. Update constraint FIRST to temporarily allow BOTH living_group_leader AND living_group
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY['admin'::text, 'staph'::text, 'club'::text, 'living_group_leader'::text, 'living_group'::text, 'student'::text]));

-- 3. For users with living_group_leader role who have permissions in living_group_leader_permissions,
-- set is_living_group_leader = true and change their role to student
UPDATE public.users u
SET is_living_group_leader = true, role = 'student'
WHERE u.role = 'living_group_leader'
AND EXISTS (
  SELECT 1 FROM public.living_group_leader_permissions lgp
  WHERE lgp.user_id = u.id AND lgp.status = 'active'
);

-- 4. For living group organization accounts (users tied to living_groups table),
-- change role from living_group_leader to living_group
UPDATE public.users u
SET role = 'living_group'
WHERE u.role = 'living_group_leader'
AND EXISTS (
  SELECT 1 FROM public.living_groups lg
  WHERE lg.user_id = u.id
);

-- 5. Finalize constraint - remove living_group_leader now that all data is migrated
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY['admin'::text, 'staph'::text, 'club'::text, 'living_group'::text, 'student'::text]));

-- 6. Create index for efficient queries on is_living_group_leader
CREATE INDEX IF NOT EXISTS idx_users_is_lg_leader ON public.users(is_living_group_leader) WHERE is_living_group_leader = true;
