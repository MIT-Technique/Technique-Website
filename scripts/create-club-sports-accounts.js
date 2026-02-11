/**
 * Create Club Sports Accounts
 *
 * Creates Supabase auth accounts and club records for club sports.
 * Uses actual MIT emails from CSV file and generates unique passwords.
 *
 * Usage:
 *   node scripts/create-club-sports-accounts.js
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
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  const clubSports = [];
  for (const line of dataLines) {
    // Simple CSV parsing (handles basic cases)
    const [name, email] = line.split(",").map((s) => s.trim());

    if (name && email) {
      clubSports.push({ name, email });
    }
  }

  return clubSports;
}

/**
 * Generate a unique password with prefix
 */
function generatePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString() + crypto.randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

/**
 * Delete existing auth user by email if it exists
 */
async function deleteExistingAuthUser(email) {
  // List users to find the one with this email
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error(`Failed to list users: ${listError.message}`);
    return false;
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      existingUser.id
    );
    if (deleteError) {
      console.error(
        `Failed to delete auth user ${email}: ${deleteError.message}`
      );
      return false;
    }
    return true;
  }
  return false;
}

async function createClubSportsAccounts() {
  // Read club sports from CSV
  const csvPath = path.join(__dirname, "input", "club sport list.csv");
  const clubSports = parseCSV(csvPath);

  console.log(`Creating accounts for ${clubSports.length} club sports...\n`);

  // First, clean up any existing auth users for these club sports
  console.log("Cleaning up existing auth users...\n");
  let deleted = 0;
  for (const sport of clubSports) {
    if (await deleteExistingAuthUser(sport.email)) {
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} existing auth users.\n`);
  console.log("Creating new accounts...\n");

  const createdAccounts = [];
  let skipped = 0;
  let errors = 0;

  for (const sport of clubSports) {
    const { name, email } = sport;
    const password = generatePassword(name);

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
        if (authError.message.includes("already exists")) {
          console.log(`-- ${name}: Auth account already exists`);
          skipped++;
          continue;
        }
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
        // User might already exist, try to update
        if (userError.message.includes("duplicate")) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

          if (existingUser) {
            await supabase
              .from("users")
              .update({ supabase_auth_id: authData.user.id })
              .eq("id", existingUser.id);
          }
        } else {
          throw new Error(`User error: ${userError.message}`);
        }
      }

      // 3. Get the user ID (either from insert or existing)
      const { data: finalUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (!finalUser) {
        throw new Error("Could not find or create user record");
      }

      // 4. Create club record (club sports are stored as clubs)
      const { error: clubError } = await supabase.from("clubs").insert({
        user_id: finalUser.id,
        name: name,
        approval_status: "approved",
      });

      if (clubError) {
        if (clubError.message.includes("duplicate")) {
          console.log(`-- ${name}: Club record already exists`);
          skipped++;
          continue;
        }
        throw new Error(`Club error: ${clubError.message}`);
      }

      console.log(`OK ${name} (${email})`);
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

  // Save credentials to CSV
  if (createdAccounts.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join(__dirname, "output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvOutPath = path.join(
      outputDir,
      `club-sports-credentials-${timestamp}.csv`
    );
    const csvContent = ["Club Sport Name,Email,Password"]
      .concat(
        createdAccounts.map(
          (a) => `"${a.name}","${a.email}","${a.password}"`
        )
      )
      .join("\n");
    fs.writeFileSync(csvOutPath, csvContent);

    console.log(`\nCredentials saved to: ${csvOutPath}`);
  }

  console.log(
    `\nDone: ${createdAccounts.length} created, ${skipped} skipped, ${errors} errors`
  );
}

createClubSportsAccounts().catch(console.error);
