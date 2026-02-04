/**
 * Update FSILGs - February 2026
 *
 * This script:
 * 1. Disables closed FSILGs (sets status to 'disabled' so they don't appear in org auth search)
 * 2. Creates new FSILG accounts
 *
 * Usage:
 *   node scripts/update-fsilgs-feb-2026.js
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

// FSILGs to disable (marked as "Closed" in the spreadsheet)
const fsilgsToDisable = [
  "Alpha Phi Alpha (MGC)",
  "Alpha Tau Omega (ATO)",
  "Delta Upsilon (DU)",
  "Phi Gamma Delta (FIJI)",
  "Sigma Alpha Mu (Sammy)",
  "Sigma Phi Epsilon (SigEp)",
  "Tau Epsilon Phi (tEp)",
  "Phi Sigma Rho (Phi Rho)",
];

// New FSILGs to add
const newFsilgs = [
  { name: "Phi Beta Sigma (Sigmas)", affiliation: "MGC" },
  { name: "Phi Kappa Psi (Phi Psi)", affiliation: "IFC" },
  { name: "Lambda Upsilon Lambda", affiliation: "MGC" },
  { name: "Interfraternity Council (IFC)", affiliation: "IFC" },
  { name: "Panhellenic Council (Panhel)", affiliation: "Panhel" },
];

function safeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateUniquePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString() + crypto.randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

async function disableClosedFsilgs() {
  console.log("=== Disabling Closed FSILGs ===\n");

  let disabled = 0;
  let notFound = 0;
  let errors = 0;

  for (const fsilgName of fsilgsToDisable) {
    try {
      // Find the living group by name (need user_id to find associated user)
      const { data: lg, error: findError } = await supabase
        .from("living_groups")
        .select("id, name, status, user_id")
        .eq("name", fsilgName)
        .maybeSingle();

      if (findError) {
        console.error(`XX ${fsilgName}: Error finding living group - ${findError.message}`);
        errors++;
        continue;
      }

      if (!lg) {
        console.log(`-- ${fsilgName}: Not found in database`);
        notFound++;
        continue;
      }

      // 1. Disable the living group
      const { error: lgUpdateError } = await supabase
        .from("living_groups")
        .update({
          status: "disabled",
          disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", lg.id);

      if (lgUpdateError) {
        console.error(`XX ${fsilgName}: Error disabling living group - ${lgUpdateError.message}`);
        errors++;
        continue;
      }

      // 2. Find and disable the user in public.users
      const { data: user, error: userFindError } = await supabase
        .from("users")
        .select("id, supabase_auth_id")
        .eq("id", lg.user_id)
        .maybeSingle();

      if (userFindError) {
        console.error(`XX ${fsilgName}: Error finding user - ${userFindError.message}`);
        errors++;
        continue;
      }

      if (user) {
        // Disable the user in public.users
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (userUpdateError) {
          console.error(`XX ${fsilgName}: Error disabling user - ${userUpdateError.message}`);
          errors++;
          continue;
        }

        // 3. Disable the Supabase auth user (ban them so they can't log in)
        if (user.supabase_auth_id) {
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            user.supabase_auth_id,
            { ban_duration: "876600h" } // ~100 years (effectively permanent)
          );

          if (authUpdateError) {
            console.error(`XX ${fsilgName}: Error banning auth user - ${authUpdateError.message}`);
            errors++;
            continue;
          }
        }
      }

      console.log(`OK ${fsilgName}: Disabled (living_group + user + auth)`);
      disabled++;
    } catch (error) {
      console.error(`XX ${fsilgName}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\nDisable summary: ${disabled} disabled, ${notFound} not found, ${errors} errors\n`);
  return { disabled, notFound, errors };
}

async function createNewFsilgs() {
  console.log("=== Creating New FSILGs ===\n");

  const createdAccounts = [];
  let skipped = 0;
  let errors = 0;

  for (const fsilg of newFsilgs) {
    const email = `fsilg-${safeName(fsilg.name)}@mit.edu`;

    try {
      const uniquePassword = generateUniquePassword(fsilg.name);

      // 1. Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email,
          password: uniquePassword,
          email_confirm: true,
          user_metadata: {
            name: fsilg.name,
            role: "living_group",
          },
        });

      if (authError) {
        if (authError.message.includes("already exists")) {
          console.log(`-- ${fsilg.name}: Auth account already exists`);
          skipped++;
        } else {
          console.error(`XX ${fsilg.name}: ${authError.message}`);
          errors++;
        }
        continue;
      }

      // 2. Create or update public.users record
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      let userId;

      if (existingUser) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            supabase_auth_id: authData.user.id,
            role: "living_group",
            name: fsilg.name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id);

        if (updateError) {
          console.error(`XX ${fsilg.name}: Failed to update user - ${updateError.message}`);
          errors++;
          continue;
        }
        userId = existingUser.id;
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            email: email,
            role: "living_group",
            name: fsilg.name,
            supabase_auth_id: authData.user.id,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error(`XX ${fsilg.name}: Failed to create user - ${insertError.message}`);
          errors++;
          continue;
        }
        userId = newUser.id;
      }

      // 3. Create living_groups record
      const { error: lgError } = await supabase
        .from("living_groups")
        .insert({
          user_id: userId,
          name: fsilg.name,
          living_group_type: "fsilg",
          affiliation: fsilg.affiliation,
          status: "active",
        });

      if (lgError) {
        if (lgError.message.includes("duplicate") || lgError.message.includes("unique")) {
          console.log(`-- ${fsilg.name}: Living group record already exists`);
        } else {
          console.error(`XX ${fsilg.name}: Failed to create living group record - ${lgError.message}`);
          errors++;
          continue;
        }
      }

      console.log(`OK ${fsilg.name} (${fsilg.affiliation})`);
      createdAccounts.push({
        name: fsilg.name,
        email: email,
        password: uniquePassword,
        affiliation: fsilg.affiliation,
      });
    } catch (error) {
      console.error(`XX ${fsilg.name}: ${error.message}`);
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

    const csvPath = path.join(outputDir, `new-fsilg-credentials-${timestamp}.csv`);
    const csvContent = ["Name,Email,Password,Affiliation"]
      .concat(
        createdAccounts.map(
          (a) => `"${a.name}","${a.email}","${a.password}","${a.affiliation}"`,
        ),
      )
      .join("\n");
    fs.writeFileSync(csvPath, csvContent);

    const jsonPath = path.join(outputDir, `new-fsilg-credentials-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(createdAccounts, null, 2));

    console.log(`\nCredentials saved to:`);
    console.log(`  CSV:  ${csvPath}`);
    console.log(`  JSON: ${jsonPath}`);
  }

  console.log(`\nCreate summary: ${createdAccounts.length} created, ${skipped} skipped, ${errors} errors`);
  return { created: createdAccounts.length, skipped, errors };
}

async function main() {
  console.log("FSILG Update - February 2026\n");
  console.log("This script will:");
  console.log("  1. Disable 8 closed FSILGs");
  console.log("  2. Create 5 new FSILG accounts\n");
  console.log("=".repeat(50) + "\n");

  const disableResult = await disableClosedFsilgs();
  const createResult = await createNewFsilgs();

  console.log("\n" + "=".repeat(50));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(50));
  console.log(`Disabled: ${disableResult.disabled} FSILGs`);
  console.log(`Created:  ${createResult.created} new FSILGs`);
  console.log(`\nIMPORTANT: Share passwords securely and delete credential files after use.`);
}

main().catch(console.error);
