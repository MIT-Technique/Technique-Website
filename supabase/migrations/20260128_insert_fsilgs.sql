-- ============================================================
-- Insert FSILGs (Fraternities, Sororities, and Independent Living Groups)
-- ============================================================
-- Purpose: Create FSILG living groups with auth credentials
-- Date: 2026-01-28
-- ============================================================

-- ============================================================
-- Step 1: Insert public.users accounts for each FSILG
-- ============================================================
INSERT INTO public.users (email, role, first_name, last_name, auth_provider)
VALUES
  -- Fraternities (IFC & MGC)
  ('alpha-delta-phi@mit.edu', 'living_group', 'Alpha Delta Phi', '(The Society)', 'supabase_auth'),
  ('alpha-epsilon-pi@mit.edu', 'living_group', 'Alpha Epsilon Pi', '(AEPi)', 'supabase_auth'),
  ('alpha-phi-alpha@mit.edu', 'living_group', 'Alpha Phi Alpha', '(MGC)', 'supabase_auth'),
  ('alpha-tau-omega@mit.edu', 'living_group', 'Alpha Tau Omega', '(ATO)', 'supabase_auth'),
  ('beta-theta-pi@mit.edu', 'living_group', 'Beta Theta Pi', '(Beta)', 'supabase_auth'),
  ('chi-phi@mit.edu', 'living_group', 'Chi Phi', '', 'supabase_auth'),
  ('delta-kappa-epsilon@mit.edu', 'living_group', 'Delta Kappa Epsilon', '(DKE)', 'supabase_auth'),
  ('delta-tau-delta@mit.edu', 'living_group', 'Delta Tau Delta', '(Delts)', 'supabase_auth'),
  ('delta-upsilon@mit.edu', 'living_group', 'Delta Upsilon', '(DU)', 'supabase_auth'),
  ('kappa-alpha-psi@mit.edu', 'living_group', 'Kappa Alpha Psi', '(MGC)', 'supabase_auth'),
  ('kappa-sigma@mit.edu', 'living_group', 'Kappa Sigma', '(Kappa Sig)', 'supabase_auth'),
  ('lambda-chi-alpha@mit.edu', 'living_group', 'Lambda Chi Alpha', '(LCA)', 'supabase_auth'),
  ('nu-delta@mit.edu', 'living_group', 'Nu Delta', '', 'supabase_auth'),
  ('number-six-club@mit.edu', 'living_group', 'Number Six Club', '(Delta Psi)', 'supabase_auth'),
  ('phi-beta-epsilon@mit.edu', 'living_group', 'Phi Beta Epsilon', '(PBE)', 'supabase_auth'),
  ('phi-delta-theta@mit.edu', 'living_group', 'Phi Delta Theta', '(Phi Delt)', 'supabase_auth'),
  ('phi-gamma-delta@mit.edu', 'living_group', 'Phi Gamma Delta', '(FIJI)', 'supabase_auth'),
  ('phi-kappa-sigma@mit.edu', 'living_group', 'Phi Kappa Sigma', '(Skulls)', 'supabase_auth'),
  ('phi-kappa-theta@mit.edu', 'living_group', 'Phi Kappa Theta', '(PKT)', 'supabase_auth'),
  ('phi-sigma-kappa@mit.edu', 'living_group', 'Phi Sigma Kappa', '(Phi Sig)', 'supabase_auth'),
  ('pi-lambda-phi@mit.edu', 'living_group', 'Pi Lambda Phi', '(Pilam)', 'supabase_auth'),
  ('sigma-alpha-epsilon@mit.edu', 'living_group', 'Sigma Alpha Epsilon', '(SAE)', 'supabase_auth'),
  ('sigma-alpha-mu@mit.edu', 'living_group', 'Sigma Alpha Mu', '(Sammy)', 'supabase_auth'),
  ('sigma-chi@mit.edu', 'living_group', 'Sigma Chi', '', 'supabase_auth'),
  ('sigma-nu@mit.edu', 'living_group', 'Sigma Nu', '', 'supabase_auth'),
  ('sigma-phi-epsilon@mit.edu', 'living_group', 'Sigma Phi Epsilon', '(SigEp)', 'supabase_auth'),
  ('tau-epsilon-phi@mit.edu', 'living_group', 'Tau Epsilon Phi', '(tEp)', 'supabase_auth'),
  ('theta-chi@mit.edu', 'living_group', 'Theta Chi', '', 'supabase_auth'),
  ('theta-delta-chi@mit.edu', 'living_group', 'Theta Delta Chi', '(TDX)', 'supabase_auth'),
  ('theta-xi@mit.edu', 'living_group', 'Theta Xi', '', 'supabase_auth'),
  ('xi-fellowship@mit.edu', 'living_group', 'Xi Fellowship', '', 'supabase_auth'),
  ('zeta-beta-tau@mit.edu', 'living_group', 'Zeta Beta Tau', '(ZBT)', 'supabase_auth'),
  ('zeta-psi@mit.edu', 'living_group', 'Zeta Psi', '', 'supabase_auth'),
  -- Sororities (Panhel & MGC)
  ('alpha-chi-omega@mit.edu', 'living_group', 'Alpha Chi Omega', '(AXO)', 'supabase_auth'),
  ('alpha-kappa-alpha@mit.edu', 'living_group', 'Alpha Kappa Alpha', '(AKA - MGC)', 'supabase_auth'),
  ('alpha-phi@mit.edu', 'living_group', 'Alpha Phi', '', 'supabase_auth'),
  ('delta-phi-epsilon@mit.edu', 'living_group', 'Delta Phi Epsilon', '(DPhiE)', 'supabase_auth'),
  ('delta-sigma-theta@mit.edu', 'living_group', 'Delta Sigma Theta', '(MGC)', 'supabase_auth'),
  ('kappa-alpha-theta@mit.edu', 'living_group', 'Kappa Alpha Theta', '(Theta)', 'supabase_auth'),
  ('omega-phi-beta@mit.edu', 'living_group', 'Omega Phi Beta', '(MGC)', 'supabase_auth'),
  ('phi-sigma-rho@mit.edu', 'living_group', 'Phi Sigma Rho', '(Phi Rho)', 'supabase_auth'),
  ('pi-beta-phi@mit.edu', 'living_group', 'Pi Beta Phi', '(Pi Phi)', 'supabase_auth'),
  ('sigma-kappa@mit.edu', 'living_group', 'Sigma Kappa', '(SK)', 'supabase_auth'),
  -- Independent Living Groups (LGC)
  ('epsilon-theta@mit.edu', 'living_group', 'Epsilon Theta', '(ET)', 'supabase_auth'),
  ('fenway-house@mit.edu', 'living_group', 'Fenway House', '', 'supabase_auth'),
  ('pika@mit.edu', 'living_group', 'pika', '', 'supabase_auth'),
  ('student-house@mit.edu', 'living_group', 'Student House', '', 'supabase_auth'),
  ('wilg@mit.edu', 'living_group', 'WILG', '', 'supabase_auth')
ON CONFLICT (email) DO UPDATE SET
  role = 'living_group',
  auth_provider = 'supabase_auth';

-- ============================================================
-- Step 2: Insert living_groups entries
-- ============================================================

-- Fraternities (IFC & MGC)
INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Delta Phi (The Society)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-delta-phi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Epsilon Pi (AEPi)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-epsilon-pi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Phi Alpha (MGC)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-phi-alpha@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Tau Omega (ATO)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-tau-omega@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Beta Theta Pi (Beta)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'beta-theta-pi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Chi Phi', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'chi-phi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Delta Kappa Epsilon (DKE)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'delta-kappa-epsilon@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Delta Tau Delta (Delts)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'delta-tau-delta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Delta Upsilon (DU)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'delta-upsilon@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Kappa Alpha Psi (MGC)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'kappa-alpha-psi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Kappa Sigma (Kappa Sig)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'kappa-sigma@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Lambda Chi Alpha (LCA)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'lambda-chi-alpha@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Nu Delta', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'nu-delta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Number Six Club (Delta Psi)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'number-six-club@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Beta Epsilon (PBE)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-beta-epsilon@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Delta Theta (Phi Delt)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-delta-theta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Gamma Delta (FIJI)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-gamma-delta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Kappa Sigma (Skulls)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-kappa-sigma@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Kappa Theta (PKT)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-kappa-theta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Sigma Kappa (Phi Sig)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-sigma-kappa@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Pi Lambda Phi (Pilam)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'pi-lambda-phi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Sigma Alpha Epsilon (SAE)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'sigma-alpha-epsilon@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Sigma Alpha Mu (Sammy)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'sigma-alpha-mu@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Sigma Chi', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'sigma-chi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Sigma Nu', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'sigma-nu@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Sigma Phi Epsilon (SigEp)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'sigma-phi-epsilon@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Tau Epsilon Phi (tEp)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'tau-epsilon-phi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Theta Chi', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'theta-chi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Theta Delta Chi (TDX)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'theta-delta-chi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Theta Xi', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'theta-xi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Xi Fellowship', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'xi-fellowship@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Zeta Beta Tau (ZBT)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'zeta-beta-tau@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Zeta Psi', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'zeta-psi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

-- Sororities (Panhel & MGC)
INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Chi Omega (AXO)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-chi-omega@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Kappa Alpha (AKA - MGC)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-kappa-alpha@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Alpha Phi', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'alpha-phi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Delta Phi Epsilon (DPhiE)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'delta-phi-epsilon@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Delta Sigma Theta (MGC)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'delta-sigma-theta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Kappa Alpha Theta (Theta)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'kappa-alpha-theta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Omega Phi Beta (MGC)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'omega-phi-beta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Phi Sigma Rho (Phi Rho)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'phi-sigma-rho@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Pi Beta Phi (Pi Phi)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'pi-beta-phi@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Sigma Kappa (SK)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'sigma-kappa@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

-- Independent Living Groups (LGC)
INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Epsilon Theta (ET)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'epsilon-theta@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Fenway House', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'fenway-house@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'pika', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'pika@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Student House', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'student-house@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

INSERT INTO public.living_groups (user_id, name, living_group_type, status)
SELECT u.id, 'Women''s Independent Living Group (WILG)', 'fsilg', 'active'
FROM public.users u WHERE u.email = 'wilg@mit.edu'
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, living_group_type = EXCLUDED.living_group_type, status = EXCLUDED.status;

-- ============================================================
-- Step 3: Create auth.users entries for each FSILG
-- ============================================================
-- Each FSILG gets a unique password

-- Alpha Delta Phi (The Society)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-delta-phi@mit.edu', crypt('lTDYn6dUNsZw', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-delta-phi@mit.edu');

-- Alpha Epsilon Pi (AEPi)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-epsilon-pi@mit.edu', crypt('DC5DyMzWXqic', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-epsilon-pi@mit.edu');

-- Alpha Phi Alpha (MGC)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-phi-alpha@mit.edu', crypt('m33VH7rjatDC', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-phi-alpha@mit.edu');

-- Alpha Tau Omega (ATO)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-tau-omega@mit.edu', crypt('GyM9hAVTl2SD', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-tau-omega@mit.edu');

-- Beta Theta Pi (Beta)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'beta-theta-pi@mit.edu', crypt('FHoC6cuFlEm5', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'beta-theta-pi@mit.edu');

-- Chi Phi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'chi-phi@mit.edu', crypt('lSWEWCm7Ke59', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'chi-phi@mit.edu');

-- Delta Kappa Epsilon (DKE)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'delta-kappa-epsilon@mit.edu', crypt('WsgEzZpIFbR7', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'delta-kappa-epsilon@mit.edu');

-- Delta Tau Delta (Delts)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'delta-tau-delta@mit.edu', crypt('5kv41hDhq87a', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'delta-tau-delta@mit.edu');

-- Delta Upsilon (DU)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'delta-upsilon@mit.edu', crypt('Pu8e7UIpFoYJ', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'delta-upsilon@mit.edu');

-- Kappa Alpha Psi (MGC)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kappa-alpha-psi@mit.edu', crypt('scNnGQpSZ2db', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kappa-alpha-psi@mit.edu');

-- Kappa Sigma (Kappa Sig)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kappa-sigma@mit.edu', crypt('5qBvztIQLAGq', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kappa-sigma@mit.edu');

-- Lambda Chi Alpha (LCA)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lambda-chi-alpha@mit.edu', crypt('z0JvGnY1wpzd', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lambda-chi-alpha@mit.edu');

-- Nu Delta
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'nu-delta@mit.edu', crypt('HMXU6WmCWgxh', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nu-delta@mit.edu');

-- Number Six Club (Delta Psi)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'number-six-club@mit.edu', crypt('ZlQVK2w58bU9', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'number-six-club@mit.edu');

-- Phi Beta Epsilon (PBE)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-beta-epsilon@mit.edu', crypt('zObUasWDOMqc', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-beta-epsilon@mit.edu');

-- Phi Delta Theta (Phi Delt)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-delta-theta@mit.edu', crypt('8G5q9CQYuEXK', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-delta-theta@mit.edu');

-- Phi Gamma Delta (FIJI)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-gamma-delta@mit.edu', crypt('DjNIsQgprw5W', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-gamma-delta@mit.edu');

-- Phi Kappa Sigma (Skulls)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-kappa-sigma@mit.edu', crypt('rJ6qxnosSnLK', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-kappa-sigma@mit.edu');

-- Phi Kappa Theta (PKT)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-kappa-theta@mit.edu', crypt('cGVC3Mjseb78', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-kappa-theta@mit.edu');

-- Phi Sigma Kappa (Phi Sig)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-sigma-kappa@mit.edu', crypt('72MGs9auy2KQ', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-sigma-kappa@mit.edu');

-- Pi Lambda Phi (Pilam)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'pi-lambda-phi@mit.edu', crypt('VhS5Jgqc4fr2', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pi-lambda-phi@mit.edu');

-- Sigma Alpha Epsilon (SAE)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sigma-alpha-epsilon@mit.edu', crypt('Mzj7mLtmHQNX', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sigma-alpha-epsilon@mit.edu');

-- Sigma Alpha Mu (Sammy)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sigma-alpha-mu@mit.edu', crypt('2t9qlh3u0InI', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sigma-alpha-mu@mit.edu');

-- Sigma Chi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sigma-chi@mit.edu', crypt('ai2CUAioa5M7', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sigma-chi@mit.edu');

-- Sigma Nu
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sigma-nu@mit.edu', crypt('Iie6oNAPLgoj', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sigma-nu@mit.edu');

-- Sigma Phi Epsilon (SigEp)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sigma-phi-epsilon@mit.edu', crypt('bFOdHJRMCE9d', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sigma-phi-epsilon@mit.edu');

-- Tau Epsilon Phi (tEp)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tau-epsilon-phi@mit.edu', crypt('16CeeI52xJrL', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tau-epsilon-phi@mit.edu');

-- Theta Chi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'theta-chi@mit.edu', crypt('n9IU7xGRZDvy', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'theta-chi@mit.edu');

-- Theta Delta Chi (TDX)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'theta-delta-chi@mit.edu', crypt('SNmjamsuzmaD', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'theta-delta-chi@mit.edu');

-- Theta Xi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'theta-xi@mit.edu', crypt('v8HfRW6QlWXW', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'theta-xi@mit.edu');

-- Xi Fellowship
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'xi-fellowship@mit.edu', crypt('hC813t3kK0LA', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'xi-fellowship@mit.edu');

-- Zeta Beta Tau (ZBT)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'zeta-beta-tau@mit.edu', crypt('Diws78UpZx4g', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'zeta-beta-tau@mit.edu');

-- Zeta Psi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'zeta-psi@mit.edu', crypt('CryngfahNdoS', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'zeta-psi@mit.edu');

-- Sororities
-- Alpha Chi Omega (AXO)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-chi-omega@mit.edu', crypt('6PxupaiOfQl8', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-chi-omega@mit.edu');

-- Alpha Kappa Alpha (AKA - MGC)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-kappa-alpha@mit.edu', crypt('EiAbq2LdDtKB', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-kappa-alpha@mit.edu');

-- Alpha Phi
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'alpha-phi@mit.edu', crypt('fANX1f6kdERf', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alpha-phi@mit.edu');

-- Delta Phi Epsilon (DPhiE)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'delta-phi-epsilon@mit.edu', crypt('U2alhh2vxqmB', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'delta-phi-epsilon@mit.edu');

-- Delta Sigma Theta (MGC)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'delta-sigma-theta@mit.edu', crypt('OYkCn4mNAILr', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'delta-sigma-theta@mit.edu');

-- Kappa Alpha Theta (Theta)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kappa-alpha-theta@mit.edu', crypt('hDR9slwE2Eds', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kappa-alpha-theta@mit.edu');

-- Omega Phi Beta (MGC)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'omega-phi-beta@mit.edu', crypt('Ce3E89SOMrpd', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'omega-phi-beta@mit.edu');

-- Phi Sigma Rho (Phi Rho)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phi-sigma-rho@mit.edu', crypt('XMlTCIgM0x6f', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phi-sigma-rho@mit.edu');

-- Pi Beta Phi (Pi Phi)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'pi-beta-phi@mit.edu', crypt('n9UNGk2TgwVs', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pi-beta-phi@mit.edu');

-- Sigma Kappa (SK)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sigma-kappa@mit.edu', crypt('A0BdMZU3wNE2', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sigma-kappa@mit.edu');

-- Independent Living Groups
-- Epsilon Theta (ET)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'epsilon-theta@mit.edu', crypt('ucQgvmoAttN0', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'epsilon-theta@mit.edu');

-- Fenway House
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'fenway-house@mit.edu', crypt('aZVp060VmIlz', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fenway-house@mit.edu');

-- pika
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'pika@mit.edu', crypt('6dWUrAUZdiYW', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pika@mit.edu');

-- Student House
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'student-house@mit.edu', crypt('6FZ3z0v58EOw', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student-house@mit.edu');

-- WILG
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'wilg@mit.edu', crypt('Ca4OmPfjUFrt', gen_salt('bf')), now(), now(), now(), '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'wilg@mit.edu');

-- ============================================================
-- Step 4: Link auth.users to public.users
-- ============================================================
UPDATE public.users u
SET supabase_auth_id = (
  SELECT au.id FROM auth.users au WHERE au.email = u.email
)
WHERE u.role = 'living_group'
  AND u.auth_provider = 'supabase_auth'
  AND u.supabase_auth_id IS NULL;

-- ============================================================
-- Verification
-- ============================================================
SELECT lg.name, lg.living_group_type, lg.status, u.email
FROM public.living_groups lg
JOIN public.users u ON u.id = lg.user_id
WHERE lg.living_group_type = 'fsilg'
ORDER BY lg.name;
