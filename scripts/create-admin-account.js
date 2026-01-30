/**
 * Create Admin Account
 *
 * Creates a Supabase auth user and users table record for the admin account.
 * The password is hashed by Supabase Auth automatically.
 *
 * Usage:
 *   node scripts/create-admin-account.js
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

const ADMIN_EMAIL = "tnq-exec@mit.edu";

function generateSecurePassword() {
  // Generate a 16-character secure password
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  const bytes = crypto.randomBytes(16);
  let password = "TNQ-";
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function createAdminAccount() {
  const password = generateSecurePassword();

  console.log("Creating admin account...");
  console.log(`  Email: ${ADMIN_EMAIL}`);

  // 1. Find existing auth user by email and delete, then recreate
  let authUserId;

  // Search for existing auth user across all pages
  let page = 1;
  let existingAuth = null;
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !users || users.length === 0) break;
    existingAuth = users.find(u => u.email === ADMIN_EMAIL);
    if (existingAuth) break;
    if (users.length < 1000) break;
    page++;
  }

  if (existingAuth) {
    console.log("  Existing auth user found, deleting...");
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuth.id);
    if (deleteError) {
      console.error(`  Failed to delete existing auth user: ${deleteError.message}`);
      process.exit(1);
    }
    console.log("  Deleted existing auth user.");
  }

  // Create new auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
    user_metadata: {
      name: "Technique Admin",
      role: "admin",
    },
  });

  if (authError) {
    console.error(`  Failed to create auth user: ${authError.message}`);
    process.exit(1);
  }
  authUserId = authData.user.id;

  // 2. Upsert public.users record
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (existingUser) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        supabase_auth_id: authUserId,
        role: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingUser.id);

    if (updateError) {
      console.error(`  Failed to update user record: ${updateError.message}`);
      process.exit(1);
    }
    console.log("  Updated existing user record.");
  } else {
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        email: ADMIN_EMAIL,
        role: "admin",
        first_name: "Technique",
        last_name: "Admin",
        auth_provider: "supabase_auth",
        supabase_auth_id: authUserId,
        is_active: true,
      });

    if (insertError) {
      console.error(`  Failed to create user record: ${insertError.message}`);
      process.exit(1);
    }
    console.log("  Created new user record.");
  }

  // 3. Save credentials
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const credPath = path.join(outputDir, `admin-credentials-${timestamp}.json`);
  fs.writeFileSync(
    credPath,
    JSON.stringify({ email: ADMIN_EMAIL, password }, null, 2),
  );

  console.log(`\nAdmin account ready.`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${password}`);
  console.log(`\n  Credentials saved to: ${credPath}`);
  console.log(`\n  IMPORTANT: Share this password securely and delete the credentials file after use.`);
}

createAdminAccount().catch(console.error);
