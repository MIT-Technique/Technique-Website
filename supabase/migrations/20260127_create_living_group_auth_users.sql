-- ============================================================
-- Create Supabase Auth Users for Living Groups
-- ============================================================
-- Purpose: Create authentication credentials for living groups
-- Date: 2026-01-27
-- Note: These are TEMPORARY passwords - living groups should change them on first login
-- ============================================================

-- IMPORTANT: Run this migration AFTER creating the public.users entries

-- Create auth.users entries for each living group
-- Password for all accounts: "Technique2026!" (they should change this on first login)

-- Baker House
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'baker@mit.edu',
  crypt('Technique2026!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'baker@mit.edu'
);

-- Random Hall
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'random@mit.edu',
  crypt('Technique2026!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'random@mit.edu'
);

-- NOTE: The above pattern should be repeated for all living groups
-- But for security reasons, it's BETTER to use Option 3 below

-- ============================================================
-- Link auth.users to public.users
-- ============================================================
-- After creating auth users, link them to public.users via supabase_auth_id

UPDATE public.users u
SET supabase_auth_id = (
  SELECT au.id
  FROM auth.users au
  WHERE au.email = u.email
)
WHERE u.email LIKE '%@mit.edu'
  AND u.role = 'living_group'
  AND u.supabase_auth_id IS NULL;
