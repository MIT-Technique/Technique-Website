/**
 * Reset/Create Test Sports Credentials
 *
 * Creates auth user if missing, creates users record if missing,
 * links to existing sports record, and resets password.
 *
 * Usage:
 *   node scripts/reset-test-sports-credentials.js
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

const EMAIL = "test-sports@mit.edu";
const NAME = "Test Sports";

async function resetTestSportsCredentials() {
  const newPassword = "TNQ-" + crypto.randomBytes(6).toString("hex");

  // 1. Check if auth user exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  let authUser = users.find(u => u.email === EMAIL);

  if (!authUser) {
    console.log("Creating auth user for " + EMAIL);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: newPassword,
      email_confirm: true,
      user_metadata: { name: NAME, role: "sports" },
    });

    if (authError) {
      console.error("Failed to create auth user:", authError.message);
      process.exit(1);
    }
    authUser = authData.user;
    console.log("OK   Created auth user");
  } else {
    // Reset password for existing user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Failed to reset password:", updateError.message);
      process.exit(1);
    }
    console.log("OK   Reset password for existing auth user");
  }

  // 2. Check if users record exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", EMAIL)
    .maybeSingle();

  let userId;

  if (!existingUser) {
    console.log("Creating users record for " + EMAIL);
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: EMAIL,
        role: "sports",
        supabase_auth_id: authUser.id,
        name: NAME,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create users record:", insertError.message);
      process.exit(1);
    }
    userId = newUser.id;
    console.log("OK   Created users record");
  } else {
    // Update existing user to link auth
    await supabase
      .from("users")
      .update({ supabase_auth_id: authUser.id, role: "sports" })
      .eq("id", existingUser.id);
    userId = existingUser.id;
    console.log("OK   Updated existing users record");
  }

  // 3. Check if sports record exists and link it
  const { data: existingSports } = await supabase
    .from("sports")
    .select("id, user_id")
    .eq("name", NAME)
    .maybeSingle();

  if (existingSports) {
    if (existingSports.user_id !== userId) {
      await supabase
        .from("sports")
        .update({ user_id: userId })
        .eq("id", existingSports.id);
      console.log("OK   Linked sports record to user");
    } else {
      console.log("OK   Sports record already linked");
    }
  } else {
    const { error: sportsError } = await supabase
      .from("sports")
      .insert({
        user_id: userId,
        name: NAME,
        has_gender_teams: false,
      });

    if (sportsError) {
      console.error("Failed to create sports record:", sportsError.message);
      process.exit(1);
    }
    console.log("OK   Created sports record");
  }

  console.log("\n" + "=".repeat(50));
  console.log("TEST SPORTS CREDENTIALS");
  console.log("=".repeat(50) + "\n");
  console.log("Test Sports");
  console.log("  Login name: Test Sports");
  console.log("  Password:   " + newPassword);
  console.log("\n" + "=".repeat(50));
}

resetTestSportsCredentials().catch(console.error);
