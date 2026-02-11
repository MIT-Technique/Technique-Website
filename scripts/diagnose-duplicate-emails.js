/**
 * Diagnose Duplicate Emails
 *
 * Finds out which accounts are using the target emails and provides options to fix them.
 *
 * Run with: node scripts/diagnose-duplicate-emails.js
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

const problemEmails = [
  { email: 'theta-exec@mit.edu', expectedOrg: 'Kappa Alpha Theta' },
  { email: 'sk-govboard@mit.edu', expectedOrg: 'Sigma Kappa' },
];

async function diagnoseEmail(email, expectedOrg) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Diagnosing: ${email}`);
  console.log(`Expected org: ${expectedOrg}`);
  console.log('='.repeat(70));

  // Find all users with this email
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('✓ Email not in use - safe to assign');
    return;
  }

  console.log(`\nFound ${users.length} user(s) with this email:\n`);

  for (const user of users) {
    console.log(`User ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Active: ${user.is_active}`);
    console.log(`  Auth ID: ${user.supabase_auth_id || 'None'}`);
    console.log(`  Created: ${user.created_at}`);

    // Check what this account is linked to
    if (user.role === 'living_group') {
      const { data: lg } = await supabase
        .from('living_groups')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (lg) {
        console.log(`  Living Group: ${lg.name}`);
        console.log(`  ${lg.name === expectedOrg ? '✓ CORRECT ORG' : '✗ WRONG ORG'}`);
      } else {
        console.log(`  Living Group: None (orphaned account)`);
      }
    } else if (user.role === 'club') {
      const { data: club } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (club) {
        console.log(`  Club: ${club.name}`);
      } else {
        console.log(`  Club: None (orphaned account)`);
      }
    } else if (user.role === 'sports') {
      const { data: sports } = await supabase
        .from('sports')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sports) {
        console.log(`  Sports: ${sports.name}`);
      } else {
        console.log(`  Sports: None (orphaned account)`);
      }
    }

    // Check if auth account exists
    if (user.supabase_auth_id) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
        user.supabase_auth_id
      );

      if (authError) {
        console.log(`  Auth Status: ❌ Error - ${authError.message}`);
      } else if (authUser) {
        console.log(`  Auth Email: ${authUser.user.email}`);
        console.log(`  Auth Confirmed: ${!!authUser.user.email_confirmed_at}`);
      } else {
        console.log(`  Auth Status: Auth user not found`);
      }
    }

    console.log('');
  }

  // Now find the expected org
  console.log(`Looking for expected org: ${expectedOrg}...`);
  const { data: expectedLG } = await supabase
    .from('living_groups')
    .select('id, name, user_id, users!living_groups_user_id_fkey(id, email, supabase_auth_id)')
    .ilike('name', `%${expectedOrg}%`)
    .maybeSingle();

  if (expectedLG) {
    const lgUser = Array.isArray(expectedLG.users) ? expectedLG.users[0] : expectedLG.users;
    console.log(`\nFound expected living group:`);
    console.log(`  Name: ${expectedLG.name}`);
    console.log(`  User ID: ${lgUser.id}`);
    console.log(`  Current Email: ${lgUser.email}`);
    console.log(`  Auth ID: ${lgUser.supabase_auth_id || 'None'}`);
  } else {
    console.log(`\n❌ Expected living group not found`);
  }
}

async function main() {
  console.log('Duplicate Email Diagnostics');
  console.log('='.repeat(70));

  for (const { email, expectedOrg } of problemEmails) {
    await diagnoseEmail(email, expectedOrg);
  }

  console.log('\n' + '='.repeat(70));
  console.log('Diagnosis complete');
  console.log('='.repeat(70));
}

main();
