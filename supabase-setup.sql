-- =============================================================================
-- Supabase Setup Script for MIT Technique Website
-- =============================================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create the bios table for senior yearbook information
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  quote TEXT CHECK (char_length(quote) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_bios_email ON public.bios(email);

-- Add comment for documentation
COMMENT ON TABLE public.bios IS 'Stores senior bio information for the MIT Technique yearbook';

-- -----------------------------------------------------------------------------
-- 2. Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.bios ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. Create RLS Policies
-- -----------------------------------------------------------------------------
-- Note: Since we're using MIT OIDC auth (not Supabase Auth), we'll use
-- service role key for all operations. These policies are for additional safety.

-- Policy: Allow service role full access (for API routes using service key)
CREATE POLICY "Service role has full access" ON public.bios
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. Auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS bios_updated_at ON public.bios;
CREATE TRIGGER bios_updated_at
  BEFORE UPDATE ON public.bios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. Verify Setup
-- -----------------------------------------------------------------------------
-- Run this query to verify the table was created correctly:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bios';

-- -----------------------------------------------------------------------------
-- 6. Optional: Insert test data (remove in production)
-- -----------------------------------------------------------------------------
-- INSERT INTO public.bios (email, first_name, last_name, major, quote)
-- VALUES ('test@mit.edu', 'Test', 'User', '6-3', 'Hello World!');

-- -----------------------------------------------------------------------------
-- 7. Create the users table for authenticated accounts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  mit_sub TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_mit_sub ON public.users(mit_sub);

-- Add comment for documentation
COMMENT ON TABLE public.users IS 'Stores authenticated user accounts linked to MIT OIDC';

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- NOTES:
-- -----------------------------------------------------------------------------
-- 1. This setup uses a service role key for API access since we're keeping
--    MIT OIDC authentication (not migrating to Supabase Auth)
--
-- 2. The email field is the unique identifier, matching your MIT SSO flow
--
-- 3. Names are stored in plain text (Supabase encrypts at rest by default)
--    If you need field-level encryption, you can continue using Cryptr
--
-- 4. The quote field has a 300 character limit matching your current schema
--
-- 5. The users table stores authenticated accounts (separate from bios)
--    - email: MIT email address
--    - name: User's display name from MIT OIDC
--    - mit_sub: MIT subject ID (unique identifier from OIDC)
-- =============================================================================
