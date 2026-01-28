/**
 * Create Living Group Auth Accounts
 *
 * This script creates Supabase auth users for all living groups
 * with temporary passwords that should be changed on first login.
 *
 * Usage:
 * node scripts/create-living-group-accounts.js
 *
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard -> Settings -> API)
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
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const livingGroups = [
  { email: "baker@mit.edu", name: "Baker House" },
  { email: "random@mit.edu", name: "Random Hall" },
  { email: "burton-conner@mit.edu", name: "Burton-Conner House" },
  { email: "east-campus@mit.edu", name: "East Campus" },
  { email: "macgregor@mit.edu", name: "MacGregor House" },
  { email: "maseeh@mit.edu", name: "Maseeh Hall" },
  { email: "mccormick@mit.edu", name: "McCormick Hall" },
  { email: "new-house@mit.edu", name: "New House" },
  { email: "new-vassar@mit.edu", name: "New Vassar" },
  { email: "next@mit.edu", name: "Next House" },
  { email: "simmons@mit.edu", name: "Simmons Hall" },
];

// Generate a unique password hash for each living group
function generateUniquePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString())
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

async function createLivingGroupAccounts() {
  console.log("Creating living group accounts...\n");

  const createdAccounts = [];

  for (const lg of livingGroups) {
    try {
      const uniquePassword = generateUniquePassword(lg.name);

      // Create auth user using Supabase Admin API
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: lg.email,
          password: uniquePassword,
          email_confirm: true, // Skip email verification
          user_metadata: {
            name: lg.name,
            role: "living_group",
          },
        });

      if (authError) {
        if (authError.message.includes("already exists")) {
          console.log(`⚠️  ${lg.name}: Account already exists`);
        } else {
          console.error(`❌ ${lg.name}: ${authError.message}`);
        }
        continue;
      }

      // Link auth user to public.users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ supabase_auth_id: authData.user.id })
        .eq("email", lg.email);

      if (updateError) {
        console.error(
          `❌ ${lg.name}: Failed to link auth user - ${updateError.message}`,
        );
      } else {
        console.log(`✅ ${lg.name}: Account created successfully`);
        createdAccounts.push({
          name: lg.name,
          email: lg.email,
          password: uniquePassword,
        });
      }
    } catch (error) {
      console.error(`❌ ${lg.name}: Unexpected error - ${error.message}`);
    }
  }

  // Save credentials to files
  if (createdAccounts.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join(__dirname, "output");

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save as CSV (easy to share via spreadsheet)
    const csvPath = path.join(
      outputDir,
      `living-group-credentials-${timestamp}.csv`,
    );
    const csvContent = ["Living Group,Email,Password"]
      .concat(
        createdAccounts.map((a) => `"${a.name}","${a.email}","${a.password}"`),
      )
      .join("\n");
    fs.writeFileSync(csvPath, csvContent);

    // Save as JSON (for programmatic access)
    const jsonPath = path.join(
      outputDir,
      `living-group-credentials-${timestamp}.json`,
    );
    fs.writeFileSync(jsonPath, JSON.stringify(createdAccounts, null, 2));

    // Print to console
    console.log("\n========================================");
    console.log("CREDENTIALS (save these securely!)");
    console.log("========================================\n");
    for (const account of createdAccounts) {
      console.log(`${account.name}`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log("");
    }

    console.log("========================================");
    console.log("FILES SAVED:");
    console.log(`  CSV: ${csvPath}`);
    console.log(`  JSON: ${jsonPath}`);
    console.log("========================================");
  }

  console.log("\n✅ Done! All accounts have been processed.");
  console.log(
    "\n⚠️  IMPORTANT: Distribute credentials securely to living groups.",
  );
  console.log("   Delete the credential files after distribution!");
  console.log("   Living groups should change their passwords on first login!");
}

createLivingGroupAccounts().catch(console.error);
