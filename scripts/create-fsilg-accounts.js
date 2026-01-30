/**
 * Create FSILG (Fraternities, Sororities, Independent Living Groups) Auth Accounts
 *
 * Creates Supabase auth users, public.users records, and living_groups records
 * for all FSILGs with living_group_type = 'fsilg'.
 *
 * Usage:
 *   node scripts/create-fsilg-accounts.js
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

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const fsilgs = [
  // Fraternities (IFC & MGC)
  { name: "Alpha Delta Phi (The Society)", affiliation: "IFC" },
  { name: "Alpha Epsilon Pi (AEPi)", affiliation: "IFC" },
  { name: "Alpha Phi Alpha (MGC)", affiliation: "MGC" },
  { name: "Alpha Tau Omega (ATO)", affiliation: "IFC" },
  { name: "Beta Theta Pi (Beta)", affiliation: "IFC" },
  { name: "Chi Phi", affiliation: "IFC" },
  { name: "Delta Kappa Epsilon (DKE)", affiliation: "IFC" },
  { name: "Delta Tau Delta (Delts)", affiliation: "IFC" },
  { name: "Delta Upsilon (DU)", affiliation: "IFC" },
  { name: "Kappa Alpha Psi (MGC)", affiliation: "MGC" },
  { name: "Kappa Sigma (Kappa Sig)", affiliation: "IFC" },
  { name: "Lambda Chi Alpha (LCA)", affiliation: "IFC" },
  { name: "Nu Delta", affiliation: "IFC" },
  { name: "Number Six Club (Delta Psi)", affiliation: "IFC" },
  { name: "Phi Beta Epsilon (PBE)", affiliation: "IFC" },
  { name: "Phi Delta Theta (Phi Delt)", affiliation: "IFC" },
  { name: "Phi Gamma Delta (FIJI)", affiliation: "IFC" },
  { name: "Phi Kappa Sigma (Skulls)", affiliation: "IFC" },
  { name: "Phi Kappa Theta (PKT)", affiliation: "IFC" },
  { name: "Phi Sigma Kappa (Phi Sig)", affiliation: "IFC" },
  { name: "Pi Lambda Phi (Pilam)", affiliation: "IFC" },
  { name: "Sigma Alpha Epsilon (SAE)", affiliation: "IFC" },
  { name: "Sigma Alpha Mu (Sammy)", affiliation: "IFC" },
  { name: "Sigma Chi", affiliation: "IFC" },
  { name: "Sigma Nu", affiliation: "IFC" },
  { name: "Sigma Phi Epsilon (SigEp)", affiliation: "IFC" },
  { name: "Tau Epsilon Phi (tEp)", affiliation: "IFC" },
  { name: "Theta Chi", affiliation: "IFC" },
  { name: "Theta Delta Chi (TDX)", affiliation: "IFC" },
  { name: "Theta Xi", affiliation: "IFC" },
  { name: "Xi Fellowship", affiliation: "IFC" },
  { name: "Zeta Beta Tau (ZBT)", affiliation: "IFC" },
  { name: "Zeta Psi", affiliation: "IFC" },

  // Sororities (Panhel & MGC)
  { name: "Alpha Chi Omega (AXO)", affiliation: "Panhel" },
  { name: "Alpha Kappa Alpha (AKA)", affiliation: "MGC" },
  { name: "Alpha Phi", affiliation: "Panhel" },
  { name: "Delta Phi Epsilon (DPhiE)", affiliation: "Panhel" },
  { name: "Delta Sigma Theta (MGC)", affiliation: "MGC" },
  { name: "Kappa Alpha Theta (Theta)", affiliation: "Panhel" },
  { name: "Omega Phi Beta (MGC)", affiliation: "MGC" },
  { name: "Phi Sigma Rho (Phi Rho)", affiliation: "Panhel" },
  { name: "Pi Beta Phi (Pi Phi)", affiliation: "Panhel" },
  { name: "Sigma Kappa (SK)", affiliation: "Panhel" },

  // Independent Living Groups (LGC)
  { name: "Epsilon Theta (ET)", affiliation: "LGC" },
  { name: "Fenway House", affiliation: "LGC" },
  { name: "pika", affiliation: "LGC" },
  { name: "Student House", affiliation: "LGC" },
  { name: "Women's Independent Living Group (WILG)", affiliation: "LGC" },
].map((f) => ({
  ...f,
  email: `fsilg-${safeName(f.name)}@mit.edu`,
}));

function generateUniquePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString() + crypto.randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

async function createFsilgAccounts() {
  console.log(`Creating ${fsilgs.length} FSILG accounts...\n`);

  const createdAccounts = [];
  let skipped = 0;
  let errors = 0;

  for (const fsilg of fsilgs) {
    try {
      const uniquePassword = generateUniquePassword(fsilg.name);

      // 1. Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: fsilg.email,
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
        .eq("email", fsilg.email)
        .maybeSingle();

      let userId;

      if (existingUser) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            supabase_auth_id: authData.user.id,
            role: "living_group",
            auth_provider: "supabase_auth",
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
            email: fsilg.email,
            role: "living_group",
            supabase_auth_id: authData.user.id,
            auth_provider: "supabase_auth",
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
        email: fsilg.email,
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

    const csvPath = path.join(outputDir, `fsilg-credentials-${timestamp}.csv`);
    const csvContent = ["Name,Email,Password,Affiliation"]
      .concat(
        createdAccounts.map(
          (a) => `"${a.name}","${a.email}","${a.password}","${a.affiliation}"`,
        ),
      )
      .join("\n");
    fs.writeFileSync(csvPath, csvContent);

    const jsonPath = path.join(outputDir, `fsilg-credentials-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(createdAccounts, null, 2));

    console.log(`\nCredentials saved to:`);
    console.log(`  CSV:  ${csvPath}`);
    console.log(`  JSON: ${jsonPath}`);
  }

  console.log(
    `\nDone: ${createdAccounts.length} created, ${skipped} skipped, ${errors} errors`,
  );
  console.log(`\nIMPORTANT: Share passwords securely and delete credential files after use.`);
}

createFsilgAccounts().catch(console.error);
