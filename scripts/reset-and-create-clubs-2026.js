/**
 * Reset and Create Club Accounts from CSV
 *
 * Removes all existing club data (members, memberships, clubs, users, auth)
 * and creates new clubs from extracted_clubs.csv.
 *
 * Usage:
 *   node scripts/reset-and-create-clubs-2026.js
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

/**
 * Parse CSV file and return array of {name, email} objects
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  // Skip header row
  const clubs = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handles quoted values)
    const match = line.match(/^(.+?),(.+)$/);
    if (match) {
      const name = match[1].trim();
      const email = match[2].trim();
      if (name && email) {
        clubs.push({ name, email });
      }
    }
  }

  return clubs;
}

/**
 * Generate a unique password with prefix
 */
function generatePassword() {
  const hash = crypto
    .createHash("sha256")
    .update(Date.now().toString() + crypto.randomBytes(16).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

/**
 * Delete all existing club data
 */
async function deleteExistingClubData() {
  console.log("\n=== DELETING EXISTING CLUB DATA ===\n");

  // 1. Delete club manual members
  console.log("Deleting club manual members...");
  const { error: membersError, count: membersCount } = await supabase
    .from("club_manual_members")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (membersError) {
    console.error("Error deleting club manual members:", membersError.message);
  } else {
    console.log(`  Deleted ${membersCount || 0} manual members`);
  }

  // 2. Delete club memberships
  console.log("Deleting club memberships...");
  const { error: membershipsError, count: membershipsCount } = await supabase
    .from("club_memberships")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (membershipsError) {
    console.error("Error deleting club memberships:", membershipsError.message);
  } else {
    console.log(`  Deleted ${membershipsCount || 0} memberships`);
  }

  // 3. Delete clubs
  console.log("Deleting clubs...");
  const { error: clubsError, count: clubsCount } = await supabase
    .from("clubs")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (clubsError) {
    console.error("Error deleting clubs:", clubsError.message);
  } else {
    console.log(`  Deleted ${clubsCount || 0} clubs`);
  }

  // 4. Get all club users to delete their auth accounts
  console.log("Fetching club users...");
  const { data: clubUsers, error: fetchError } = await supabase
    .from("users")
    .select("id, email, supabase_auth_id")
    .eq("role", "club");

  if (fetchError) {
    console.error("Error fetching club users:", fetchError.message);
    return;
  }

  console.log(`  Found ${clubUsers?.length || 0} club users`);

  // Store auth IDs and user IDs before deleting records
  const authIdsToDelete = clubUsers
    ?.filter((u) => u.supabase_auth_id)
    .map((u) => ({ id: u.supabase_auth_id, email: u.email })) || [];
  const userIds = clubUsers?.map((u) => u.id) || [];

  // 5. Delete sessions from public.sessions table FIRST (FK to users)
  if (userIds.length > 0) {
    console.log("Deleting sessions...");
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from("sessions")
      .delete({ count: "exact" })
      .in("user_id", userIds);

    if (sessionsError) {
      console.error("Error deleting sessions:", sessionsError.message);
    } else {
      console.log(`  Deleted ${sessionsCount || 0} sessions`);
    }
  }

  // 6. Delete user records (now that sessions are removed)
  console.log("Deleting user records...");
  const { error: usersError, count: usersCount } = await supabase
    .from("users")
    .delete({ count: "exact" })
    .eq("role", "club");

  if (usersError) {
    console.error("Error deleting users:", usersError.message);
  } else {
    console.log(`  Deleted ${usersCount || 0} user records`);
  }

  // 7. Delete auth users (now that FK is removed)
  if (authIdsToDelete.length > 0) {
    console.log("Deleting Supabase auth users...");
    let authDeleted = 0;
    let authFailed = 0;
    for (const { id, email } of authIdsToDelete) {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        // Log but continue - orphaned auth users can be cleaned manually
        console.error(`  Warning: Could not delete auth user ${email}`);
        authFailed++;
      } else {
        authDeleted++;
      }
    }
    console.log(`  Deleted ${authDeleted} auth users (${authFailed} failed)`);
    if (authFailed > 0) {
      console.log("  Note: Failed auth users may need manual cleanup in Supabase dashboard");
    }
  }

  console.log("\nDeletion complete.\n");
}

/**
 * Create clubs from CSV data
 */
async function createClubsFromCSV(clubs) {
  console.log("\n=== CREATING NEW CLUBS ===\n");
  console.log(`Creating accounts for ${clubs.length} clubs...\n`);

  const createdAccounts = [];
  let errors = 0;

  for (const club of clubs) {
    const { name, email } = club;
    const password = generatePassword();

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: name,
            role: "club",
          },
        });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      // 2. Create user record in public.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          email,
          role: "club",
          supabase_auth_id: authData.user.id,
          name: name,
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`User error: ${userError.message}`);
      }

      // 3. Create club record
      const { error: clubError } = await supabase.from("clubs").insert({
        user_id: userData.id,
        name: name,
        approval_status: "approved",
      });

      if (clubError) {
        throw new Error(`Club error: ${clubError.message}`);
      }

      console.log(`OK ${name}`);
      createdAccounts.push({
        name,
        email,
        password,
      });
    } catch (error) {
      console.error(`XX ${name}: ${error.message}`);
      errors++;
    }
  }

  return { createdAccounts, errors };
}

/**
 * Save credentials to CSV file
 */
function saveCredentials(accounts) {
  if (accounts.length === 0) {
    console.log("\nNo accounts created, skipping credentials export.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.join(__dirname, "output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csvOutPath = path.join(
    outputDir,
    `club-credentials-reset-${timestamp}.csv`
  );
  const csvContent = ["Club Name,Email,Password"]
    .concat(accounts.map((a) => `"${a.name}","${a.email}","${a.password}"`))
    .join("\n");

  fs.writeFileSync(csvOutPath, csvContent);
  console.log(`\nCredentials saved to: ${csvOutPath}`);
}

async function main() {
  const csvPath = path.join(__dirname, "output", "extracted_clubs.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  // Parse CSV
  console.log("Parsing CSV file...");
  const clubs = parseCSV(csvPath);
  console.log(`Found ${clubs.length} clubs in CSV.\n`);

  // Confirm before proceeding
  console.log("This will DELETE all existing club data and create new clubs.");
  console.log("Press Ctrl+C within 5 seconds to cancel...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Delete existing data
  await deleteExistingClubData();

  // Create new clubs
  const { createdAccounts, errors } = await createClubsFromCSV(clubs);

  // Save credentials
  saveCredentials(createdAccounts);

  // Summary
  console.log(
    `\n=== SUMMARY ===\nCreated: ${createdAccounts.length}\nErrors: ${errors}\nTotal in CSV: ${clubs.length}`
  );
}

main().catch(console.error);
