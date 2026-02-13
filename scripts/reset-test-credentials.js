/**
 * Reset Test Account Credentials
 *
 * Resets passwords for all test accounts and prints credentials.
 *
 * Usage:
 *   node scripts/reset-test-credentials.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testAccounts = [
  { name: "Test Club", email: "test-club@mit.edu", type: "club" },
  { name: "Test Sports", email: "test-sports@mit.edu", type: "sports" },
  { name: "Test Living Group", email: "test-living-group@mit.edu", type: "living_group" },
  { name: "Test Staph", email: "test-staph@mit.edu", type: "staph" },
];

function generatePassword() {
  return `TNQ-${crypto.randomBytes(6).toString("hex")}`;
}

async function resetTestCredentials() {
  console.log("Resetting test account credentials...\n");

  const credentials = [];

  // Get all auth users
  const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  for (const account of testAccounts) {
    const authUser = authUsers.find(u => u.email === account.email);

    if (!authUser) {
      console.log(`SKIP ${account.name}: No auth user found for ${account.email}`);
      continue;
    }

    const newPassword = generatePassword();

    // Reset password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`FAIL ${account.name}: ${updateError.message}`);
      continue;
    }

    console.log(`OK   ${account.name}`);
    credentials.push({
      name: account.name,
      email: account.email,
      password: newPassword,
      type: account.type,
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("TEST ACCOUNT CREDENTIALS");
  console.log("=".repeat(50) + "\n");

  for (const cred of credentials) {
    console.log(`${cred.name} (${cred.type})`);
    console.log(`  Login name: ${cred.name}`);
    console.log(`  Password:   ${cred.password}`);
    console.log("");
  }

  console.log("=".repeat(50));
  console.log(`Reset ${credentials.length}/${testAccounts.length} accounts`);
}

resetTestCredentials().catch(console.error);
