/**
 * Sync Organization Emails
 *
 * This script fixes organizations that updated their contact email but couldn't log in
 * because their Supabase Auth email wasn't updated.
 *
 * Run with: node scripts/sync-org-emails.js
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

async function syncOrgEmails() {
  console.log('Starting organization email sync...\n');

  try {
    // Fetch all organization users (club, living_group, sports)
    const { data: orgUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, supabase_auth_id, name')
      .in('role', ['club', 'living_group', 'sports'])
      .not('supabase_auth_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      process.exit(1);
    }

    console.log(`Found ${orgUsers.length} organization accounts\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of orgUsers) {
      try {
        // Get the Supabase Auth user
        const { data: authUser, error: authFetchError } = await supabase.auth.admin.getUserById(
          user.supabase_auth_id
        );

        if (authFetchError || !authUser) {
          console.error(`❌ Error fetching auth user for ${user.name || user.email}:`, authFetchError?.message);
          errorCount++;
          continue;
        }

        const authEmail = authUser.user.email;
        const dbEmail = user.email;

        // Check if emails match
        if (authEmail === dbEmail) {
          console.log(`✓ ${user.role}: ${user.name || user.email} - emails match`);
          skippedCount++;
          continue;
        }

        console.log(`\n🔄 Syncing ${user.role}: ${user.name || 'Unknown'}`);
        console.log(`   Auth email: ${authEmail}`);
        console.log(`   DB email: ${dbEmail}`);

        // Update Supabase Auth email to match database
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.supabase_auth_id,
          { email: dbEmail }
        );

        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully updated to ${dbEmail}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${user.name || user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`Total accounts: ${orgUsers.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Already in sync: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

syncOrgEmails();
