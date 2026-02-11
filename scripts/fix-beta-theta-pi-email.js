/**
 * Fix Beta Theta Pi Email
 *
 * Changes Beta Theta Pi's email from theta-exec@mit.edu to beta-theta-pi@mit.edu
 * This frees up theta-exec@mit.edu for Kappa Alpha Theta to use.
 *
 * Run with: node scripts/fix-beta-theta-pi-email.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BETA_USER_ID = '908588aa-ccb7-4446-8561-f39cabe610b0';
const NEW_EMAIL = 'beta-theta-pi@mit.edu';

async function fixBetaThetaPiEmail() {
  console.log('Fixing Beta Theta Pi email...\n');

  try {
    // Get the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, supabase_auth_id, name')
      .eq('id', BETA_USER_ID)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      process.exit(1);
    }

    console.log('Current state:');
    console.log(`  Name: ${user.name}`);
    console.log(`  Current Email: ${user.email}`);
    console.log(`  New Email: ${NEW_EMAIL}`);
    console.log(`  Auth ID: ${user.supabase_auth_id}\n`);

    // Check if new email is available
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', NEW_EMAIL)
      .neq('id', BETA_USER_ID)
      .maybeSingle();

    if (existingUser) {
      console.error(`❌ Email ${NEW_EMAIL} is already in use by user ${existingUser.id}`);
      process.exit(1);
    }

    console.log('✓ New email is available\n');
    console.log('Updating...\n');

    // Update Supabase Auth email
    if (user.supabase_auth_id) {
      console.log('Updating Supabase Auth email...');
      const { error: authError } = await supabase.auth.admin.updateUserById(
        user.supabase_auth_id,
        { email: NEW_EMAIL }
      );

      if (authError) {
        console.error('❌ Failed to update Supabase Auth email:', authError.message);
        console.error('Attempting to continue with database update...\n');
      } else {
        console.log('✅ Supabase Auth email updated\n');
      }
    }

    // Update database email
    console.log('Updating database email...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: NEW_EMAIL })
      .eq('id', BETA_USER_ID);

    if (updateError) {
      console.error('❌ Failed to update database email:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Database email updated\n');

    // Verify the change
    const { data: updatedUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', BETA_USER_ID)
      .single();

    console.log('='.repeat(60));
    console.log('SUCCESS!');
    console.log('='.repeat(60));
    console.log(`Beta Theta Pi email updated to: ${updatedUser.email}`);
    console.log(`\ntheta-exec@mit.edu is now available for Kappa Alpha Theta`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

fixBetaThetaPiEmail();
