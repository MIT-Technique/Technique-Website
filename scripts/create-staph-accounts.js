/**
 * Create Staph Accounts
 *
 * Creates Supabase auth users and users table records for staph accounts.
 * Passwords are hashed by Supabase Auth automatically.
 *
 * Usage:
 *   1. Fill in the STAPH_EMAILS array below with the staph member emails
 *   2. Run: node scripts/create-staph-accounts.js
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// ADD STAPH MEMBER EMAILS HERE
// ============================================================
const STAPH_EMAILS = [
  // "kerberos@mit.edu",
  // "another@mit.edu",
];
// ============================================================

function generateSecurePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  const bytes = crypto.randomBytes(16);
  let password = "TNQ-";
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function createStaphAccounts() {
  if (STAPH_EMAILS.length === 0) {
    console.error("Error: No emails specified. Edit STAPH_EMAILS in this script.");
    process.exit(1);
  }

  const results = [];

  for (const email of STAPH_EMAILS) {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) continue;

    const password = generateSecurePassword();
    console.log(`\nProcessing: ${trimmedEmail}`);

    try {
      // 1. Check if auth user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAuth = existingUsers?.users?.find(u => u.email === trimmedEmail);

      let authUserId;

      if (existingAuth) {
        console.log("  Auth user already exists, updating password...");
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingAuth.id,
          { password }
        );
        if (updateError) {
          console.error(`  Failed to update password: ${updateError.message}`);
          continue;
        }
        authUserId = existingAuth.id;
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: trimmedEmail,
          password,
          email_confirm: true,
          user_metadata: {
            role: "staph",
          },
        });

        if (authError) {
          console.error(`  Failed to create auth user: ${authError.message}`);
          continue;
        }
        authUserId = authData.user.id;
      }

      // 2. Upsert public.users record
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", trimmedEmail)
        .maybeSingle();

      if (existingUser) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            supabase_auth_id: authUserId,
            role: "staph",
            auth_provider: "supabase_auth",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id);

        if (updateError) {
          console.error(`  Failed to update user record: ${updateError.message}`);
          continue;
        }
        console.log("  Updated existing user record.");
      } else {
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            email: trimmedEmail,
            role: "staph",
            auth_provider: "supabase_auth",
            supabase_auth_id: authUserId,
            is_active: true,
          });

        if (insertError) {
          console.error(`  Failed to create user record: ${insertError.message}`);
          continue;
        }
        console.log("  Created new user record.");
      }

      results.push({ email: trimmedEmail, password });
      console.log(`  Done.`);
    } catch (err) {
      console.error(`  Unexpected error: ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.error("\nNo accounts were created successfully.");
    process.exit(1);
  }

  // 3. Save credentials
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(outputDir, `staph-credentials-${timestamp}.json`);
  const csvPath = path.join(outputDir, `staph-credentials-${timestamp}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(
    csvPath,
    "email,password\n" + results.map(r => `${r.email},${r.password}`).join("\n"),
  );

  console.log(`\n${results.length} staph account(s) created.`);
  console.log(`  Credentials saved to:`);
  console.log(`    ${jsonPath}`);
  console.log(`    ${csvPath}`);
  console.log(`\n  IMPORTANT: Share passwords securely and delete credential files after use.`);
}

createStaphAccounts().catch(console.error);
