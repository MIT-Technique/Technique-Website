/**
 * Check SK Email Usage
 *
 * Finds out who is using sk-govboard@mit.edu
 *
 * Run with: node scripts/check-sk-email.js
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

async function checkSKEmail() {
  console.log('Checking sk-govboard@mit.edu usage...\n');

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'sk-govboard@mit.edu');

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('✓ Email not in use - safe to assign to Sigma Kappa');
    return;
  }

  console.log(`Found ${users.length} user(s) with this email:\n`);

  for (const user of users) {
    console.log('='.repeat(60));
    console.log(`User ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Active: ${user.is_active}`);
    console.log(`  Auth ID: ${user.supabase_auth_id || 'None'}`);
    console.log(`  Created: ${user.created_at}`);

    if (user.role === 'living_group') {
      const { data: lg } = await supabase
        .from('living_groups')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (lg) {
        console.log(`  Living Group: ${lg.name}`);
        console.log(`  Expected: Sigma Kappa (SK)`);
        console.log(`  Status: ${lg.name.toLowerCase().includes('sigma kappa') ? '✓ CORRECT ORG' : '✗ WRONG ORG'}`);
      } else {
        console.log(`  Living Group: None (orphaned account)`);
      }
    }

    if (user.supabase_auth_id) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
        user.supabase_auth_id
      );

      if (!authError && authUser) {
        console.log(`  Auth Email: ${authUser.user.email}`);
      }
    }

    console.log('='.repeat(60) + '\n');
  }

  // Find Sigma Kappa
  console.log('\nLooking for Sigma Kappa (SK)...');
  const { data: sk } = await supabase
    .from('living_groups')
    .select('id, name, user_id, users!living_groups_user_id_fkey(id, email)')
    .or('name.ilike.%Sigma Kappa%,name.ilike.%(SK)%')
    .order('name');

  if (sk && sk.length > 0) {
    console.log(`\nFound ${sk.length} possible match(es):`);
    sk.forEach((lg) => {
      const lgUser = Array.isArray(lg.users) ? lg.users[0] : lg.users;
      console.log(`  - ${lg.name} (User ID: ${lgUser.id}, Email: ${lgUser.email})`);
    });
  } else {
    console.log('❌ Sigma Kappa not found');
  }
}

checkSKEmail();
