/**
 * Create Sports Team Auth Accounts
 *
 * Creates Supabase auth users and sports records for all varsity sports.
 * Each sport gets a user account (role: 'sports') and a sports table entry.
 *
 * Usage:
 *   node scripts/create-sports-accounts.js
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

// All sports teams
// has_gender_teams = true when both men's and women's teams exist
const sportsTeams = [
  { name: "Baseball", email: "sports-baseball@mit.edu", has_gender_teams: false },
  { name: "Basketball", email: "sports-basketball@mit.edu", has_gender_teams: true },
  { name: "Crew - Heavyweight", email: "sports-crew-heavyweight@mit.edu", has_gender_teams: false },
  { name: "Crew - Lightweight", email: "sports-crew-lightweight@mit.edu", has_gender_teams: true },
  { name: "Crew - Openweight", email: "sports-crew-openweight@mit.edu", has_gender_teams: false },
  { name: "Cross Country", email: "sports-cross-country@mit.edu", has_gender_teams: true },
  { name: "Fencing", email: "sports-fencing@mit.edu", has_gender_teams: true },
  { name: "Field Hockey", email: "sports-field-hockey@mit.edu", has_gender_teams: false },
  { name: "Football", email: "sports-football@mit.edu", has_gender_teams: false },
  { name: "Lacrosse", email: "sports-lacrosse@mit.edu", has_gender_teams: true },
  { name: "Rifle", email: "sports-rifle@mit.edu", has_gender_teams: true },
  { name: "Sailing", email: "sports-sailing@mit.edu", has_gender_teams: true },
  { name: "Soccer", email: "sports-soccer@mit.edu", has_gender_teams: true },
  { name: "Softball", email: "sports-softball@mit.edu", has_gender_teams: false },
  { name: "Squash", email: "sports-squash@mit.edu", has_gender_teams: false },
  { name: "Swimming and Diving", email: "sports-swimming@mit.edu", has_gender_teams: true },
  { name: "Tennis", email: "sports-tennis@mit.edu", has_gender_teams: true },
  { name: "Track and Field", email: "sports-track@mit.edu", has_gender_teams: true },
  { name: "Volleyball", email: "sports-volleyball@mit.edu", has_gender_teams: true },
  { name: "Water Polo", email: "sports-waterpolo@mit.edu", has_gender_teams: false },
];

function generateUniquePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString() + crypto.randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

async function createSportsAccounts() {
  console.log(`Creating ${sportsTeams.length} sports team accounts...\n`);

  const createdAccounts = [];
  let skipped = 0;
  let errors = 0;

  for (const sport of sportsTeams) {
    try {
      const uniquePassword = generateUniquePassword(sport.name);

      // 1. Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: sport.email,
          password: uniquePassword,
          email_confirm: true,
          user_metadata: {
            name: sport.name,
            role: "sports",
          },
        });

      if (authError) {
        if (authError.message.includes("already exists")) {
          console.log(`-- ${sport.name}: Auth account already exists`);
          skipped++;
        } else {
          console.error(`XX ${sport.name}: ${authError.message}`);
          errors++;
        }
        continue;
      }

      // 2. Create or update public.users record
      // Check if user record exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", sport.email)
        .maybeSingle();

      let userId;

      if (existingUser) {
        // Link auth user to existing record
        const { error: updateError } = await supabase
          .from("users")
          .update({
            supabase_auth_id: authData.user.id,
            role: "sports",
          })
          .eq("id", existingUser.id);

        if (updateError) {
          console.error(`XX ${sport.name}: Failed to update user - ${updateError.message}`);
          errors++;
          continue;
        }
        userId = existingUser.id;
      } else {
        // Create new user record
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            email: sport.email,
            role: "sports",
            supabase_auth_id: authData.user.id,
            auth_provider: "supabase_auth",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`XX ${sport.name}: Failed to create user - ${insertError.message}`);
          errors++;
          continue;
        }
        userId = newUser.id;
      }

      // 3. Create sports record
      const { error: sportsError } = await supabase
        .from("sports")
        .insert({
          user_id: userId,
          name: sport.name,
          has_gender_teams: sport.has_gender_teams,
        });

      if (sportsError) {
        if (sportsError.message.includes("duplicate") || sportsError.message.includes("unique")) {
          console.log(`-- ${sport.name}: Sports record already exists`);
        } else {
          console.error(`XX ${sport.name}: Failed to create sports record - ${sportsError.message}`);
          errors++;
          continue;
        }
      }

      console.log(`OK ${sport.name} (gender_teams: ${sport.has_gender_teams})`);
      createdAccounts.push({
        name: sport.name,
        email: sport.email,
        password: uniquePassword,
        has_gender_teams: sport.has_gender_teams,
      });
    } catch (error) {
      console.error(`XX ${sport.name}: ${error.message}`);
      errors++;
    }
  }

  // Save credentials
  if (createdAccounts.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = path.join(__dirname, "output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvOutPath = path.join(
      outputDir,
      `sports-credentials-${timestamp}.csv`,
    );
    const csvContent = ["Sport,Email,Password,Has Gender Teams"]
      .concat(
        createdAccounts.map(
          (a) => `"${a.name}","${a.email}","${a.password}","${a.has_gender_teams}"`,
        ),
      )
      .join("\n");
    fs.writeFileSync(csvOutPath, csvContent);

    const jsonOutPath = path.join(
      outputDir,
      `sports-credentials-${timestamp}.json`,
    );
    fs.writeFileSync(jsonOutPath, JSON.stringify(createdAccounts, null, 2));

    console.log(`\nCredentials saved to:`);
    console.log(`  CSV:  ${csvOutPath}`);
    console.log(`  JSON: ${jsonOutPath}`);
  }

  console.log(
    `\nDone: ${createdAccounts.length} created, ${skipped} skipped, ${errors} errors`,
  );
}

createSportsAccounts().catch(console.error);
