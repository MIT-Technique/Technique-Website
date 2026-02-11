/**
 * Update FSILG Official Emails
 *
 * This script updates 7 FSILG organizations to their official MIT emails.
 * It updates both the database (users.email) and Supabase Auth email.
 *
 * Run with: node scripts/update-fsilg-emails.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map of FSILG names to their official emails
const fsilgEmailUpdates = [
  { name: 'Alpha Chi Omega', shortName: 'AXO', email: 'axo-exec@mit.edu' },
  { name: 'Alpha Phi', shortName: 'Alpha Phi', email: 'aphiexec@mit.edu' },
  { name: 'Delta Phi Epsilon', shortName: 'DPhiE', email: 'dphie-lt@mit.edu' },
  { name: 'Kappa Alpha Theta', shortName: 'Theta', email: 'theta-exec@mit.edu' },
  { name: 'Pi Beta Phi', shortName: 'Pi Phi', email: 'piphi-exec@mit.edu' },
  { name: 'Sigma Kappa', shortName: 'SK', email: 'sk-govboard@mit.edu' },
  { name: 'Panhellenic Council', shortName: 'Panhel', email: 'panhel-exec@mit.edu' },
];

async function updateFSILGEmail(orgName, shortName, newEmail) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${orgName} (${shortName})`);
    console.log(`Target email: ${newEmail}`);
    console.log('='.repeat(60));

    // Try to find the living group by exact name or similar name
    const { data: livingGroups, error: searchError } = await supabase
      .from('living_groups')
      .select('id, name, user_id, users!living_groups_user_id_fkey(id, email, supabase_auth_id)')
      .or(`name.ilike.%${orgName}%,name.ilike.%${shortName}%`);

    if (searchError) {
      console.error(`❌ Error searching for living group:`, searchError.message);
      return { success: false, error: searchError.message };
    }

    if (!livingGroups || livingGroups.length === 0) {
      console.error(`❌ Living group not found`);
      return { success: false, error: 'Not found' };
    }

    // If multiple matches, try to find exact match or show options
    let livingGroup = livingGroups[0];
    if (livingGroups.length > 1) {
      console.log(`Found ${livingGroups.length} possible matches:`);
      livingGroups.forEach((lg, idx) => {
        console.log(`  ${idx + 1}. ${lg.name}`);
      });

      // Try exact match - check for shortname in parentheses or exact name match
      const exactMatch = livingGroups.find(lg => {
        const lgNameLower = lg.name.toLowerCase();
        const orgNameLower = orgName.toLowerCase();
        const shortNameLower = shortName.toLowerCase();

        // Exact name match
        if (lgNameLower === orgNameLower) return true;

        // Check if shortname appears in parentheses like "(SK)" or "(Theta)"
        const parenthesesPattern = new RegExp(`\\(${shortNameLower}\\)`, 'i');
        if (parenthesesPattern.test(lg.name)) return true;

        // Check if the org name is contained in the living group name
        if (lgNameLower.includes(orgNameLower)) return true;

        return false;
      });

      if (exactMatch) {
        livingGroup = exactMatch;
        console.log(`Using exact match: ${livingGroup.name}`);
      } else {
        console.log(`Using first match: ${livingGroup.name}`);
      }
    }

    const user = Array.isArray(livingGroup.users) ? livingGroup.users[0] : livingGroup.users;

    if (!user) {
      console.error(`❌ User account not found for living group`);
      return { success: false, error: 'User not found' };
    }

    console.log(`\nCurrent state:`);
    console.log(`  Living Group: ${livingGroup.name}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Current Email: ${user.email}`);
    console.log(`  Auth ID: ${user.supabase_auth_id || 'None'}`);

    // Check if new email is already used by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('email', newEmail)
      .neq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      console.error(`❌ Email ${newEmail} is already used by another user:`);
      console.error(`   User ID: ${existingUser.id}`);
      console.error(`   Role: ${existingUser.role}`);
      console.error(`   Name: ${existingUser.name || 'N/A'}`);
      return { success: false, error: 'Email already in use by another account' };
    }

    // Check if email is already correct
    if (user.email === newEmail) {
      console.log(`✓ Email already set to ${newEmail}`);

      // Still check if Auth email matches
      if (user.supabase_auth_id) {
        const { data: authUser, error: authFetchError } = await supabase.auth.admin.getUserById(
          user.supabase_auth_id
        );

        if (!authFetchError && authUser?.user?.email !== newEmail) {
          console.log(`⚠️  Auth email mismatch, updating...`);
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            user.supabase_auth_id,
            { email: newEmail }
          );

          if (authUpdateError) {
            console.error(`❌ Failed to update auth email:`, authUpdateError.message);
            return { success: false, error: authUpdateError.message };
          }
          console.log(`✅ Auth email synced to ${newEmail}`);
        }
      }

      return { success: true, alreadySet: true };
    }

    // Update Supabase Auth email if auth ID exists
    if (user.supabase_auth_id) {
      console.log(`\nUpdating Supabase Auth email...`);
      const { data: authUpdateData, error: authUpdateError } = await supabase.auth.admin.updateUserById(
        user.supabase_auth_id,
        { email: newEmail }
      );

      if (authUpdateError) {
        console.error(`❌ Failed to update Supabase Auth email:`, authUpdateError.message);
        console.error(`   Error details:`, JSON.stringify(authUpdateError, null, 2));

        // Try to continue with database update even if auth update fails
        console.log(`   Attempting to continue with database update...`);
      } else {
        console.log(`✅ Supabase Auth email updated`);
      }
    } else {
      console.log(`⚠️  No Supabase Auth ID found, skipping auth update`);
    }

    // Update database email
    console.log(`\nUpdating database email...`);
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('id', user.id);

    if (updateError) {
      console.error(`❌ Failed to update database email:`, updateError.message);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Database email updated`);
    console.log(`\n🎉 Successfully updated ${orgName} to ${newEmail}`);

    return { success: true, updated: true, livingGroupName: livingGroup.name };

  } catch (error) {
    console.error(`❌ Unexpected error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function updateAllFSILGs() {
  console.log('Starting FSILG email updates...\n');
  console.log('This will update the following organizations:');
  fsilgEmailUpdates.forEach((org, idx) => {
    console.log(`  ${idx + 1}. ${org.name} (${org.shortName}) → ${org.email}`);
  });
  console.log('\nPress Ctrl+C within 5 seconds to cancel...\n');

  // Wait 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000));

  const results = [];

  for (const org of fsilgEmailUpdates) {
    const result = await updateFSILGEmail(org.name, org.shortName, org.email);
    results.push({ ...org, ...result });

    // Wait a bit between updates to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success && r.updated);
  const alreadySet = results.filter(r => r.success && r.alreadySet);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successfully updated: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.name} (${r.shortName}) → ${r.email}`);
  });

  if (alreadySet.length > 0) {
    console.log(`\n✓ Already set correctly: ${alreadySet.length}`);
    alreadySet.forEach(r => {
      console.log(`   - ${r.name} (${r.shortName})`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.name} (${r.shortName}): ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Success: ${successful.length + alreadySet.length} | Failed: ${failed.length}`);
  console.log('='.repeat(60) + '\n');
}

updateAllFSILGs();
