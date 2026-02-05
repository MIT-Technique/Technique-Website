/**
 * Create Test Accounts
 *
 * Creates one test account for each role: club, sports, living_group, and staph.
 * Each account gets a Supabase auth user, a public.users record, and the
 * corresponding org table record (clubs, sports, or living_groups).
 *
 * Usage:
 *   node scripts/create-test-accounts.js
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

const testAccounts = [
  {
    name: "Test Club",
    email: "test-club@mit.edu",
    role: "club",
    type: "club",
  },
  // {
  //   name: "Test Sports",
  //   email: "test-sports@mit.edu",
  //   role: "sports",
  //   type: "sports",
  //   has_gender_teams: false,
  // },
  // {
  //   name: "Test Living Group",
  //   email: "test-living-group@mit.edu",
  //   role: "living_group",
  //   type: "living_group",
  //   living_group_type: "dorm",
  // },
  // {
  //   name: "Test Staph",
  //   email: "test-staph@mit.edu",
  //   role: "staph",
  //   type: "staph",
  // },
];

function generateUniquePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(
      name + Date.now().toString() + crypto.randomBytes(8).toString("hex"),
    )
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

async function createOrGetUser(account, password) {
  // 1. Create auth user
  let { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: account.name,
        role: account.role,
      },
    });

  if (authError) {
    if (authError.message.includes("already") || authError.message.includes("exists")) {
      console.log(`-- ${account.name}: Auth account already exists, fetching existing user`);
      // Get existing auth user
      const { data: { users: existingAuthUsers } } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.find(u => u.email === account.email);
      if (!existingAuthUser) {
        throw new Error(`Auth user exists but could not be fetched`);
      }
      // Continue with existing auth user
      authData = { user: existingAuthUser };
    } else {
      throw new Error(`Auth error: ${authError.message}`);
    }
  }

  // 2. Check if public.users record exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", account.email)
    .maybeSingle();

  let userId;

  if (existingUser) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        supabase_auth_id: authData.user.id,
        role: account.role,
        is_staph: account.type === "staph",
      })
      .eq("id", existingUser.id);

    if (updateError)
      throw new Error(`User update error: ${updateError.message}`);
    userId = existingUser.id;
  } else {
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: account.email,
        role: account.role,
        supabase_auth_id: authData.user.id,
        name: account.name,
        is_staph: account.type === "staph",
      })
      .select("id")
      .single();

    if (insertError)
      throw new Error(`User insert error: ${insertError.message}`);
    userId = newUser.id;
  }

  return { userId, authId: authData.user.id };
}

async function createOrgRecord(account, userId) {
  if (account.type === "club") {
    const { error } = await supabase.from("clubs").insert({
      user_id: userId,
      name: account.name,
      approval_status: "approved",
    });
    if (
      error &&
      !error.message.includes("duplicate") &&
      !error.message.includes("unique")
    ) {
      throw new Error(`Club insert error: ${error.message}`);
    }
  } else if (account.type === "sports") {
    const { error } = await supabase.from("sports").insert({
      user_id: userId,
      name: account.name,
      has_gender_teams: account.has_gender_teams,
    });
    if (
      error &&
      !error.message.includes("duplicate") &&
      !error.message.includes("unique")
    ) {
      throw new Error(`Sports insert error: ${error.message}`);
    }
  } else if (account.type === "living_group") {
    const { error } = await supabase.from("living_groups").insert({
      user_id: userId,
      name: account.name,
      living_group_type: account.living_group_type,
      status: "active",
    });
    if (
      error &&
      !error.message.includes("duplicate") &&
      !error.message.includes("unique")
    ) {
      throw new Error(`Living group insert error: ${error.message}`);
    }
  }
  // staph accounts don't need an org record
}

async function createTestAccounts() {
  console.log("Creating test accounts...\n");

  const createdAccounts = [];
  let errors = 0;

  for (const account of testAccounts) {
    try {
      const password = generateUniquePassword(account.name);
      const result = await createOrGetUser(account, password);

      if (!result) {
        continue; // already exists
      }

      await createOrgRecord(account, result.userId);

      console.log(`OK ${account.name} (${account.type})`);
      createdAccounts.push({
        name: account.name,
        email: account.email,
        password,
        type: account.type,
        role: account.role,
      });
    } catch (error) {
      console.error(`XX ${account.name}: ${error.message}`);
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

    const jsonOutPath = path.join(
      outputDir,
      `test-credentials-${timestamp}.json`,
    );
    fs.writeFileSync(jsonOutPath, JSON.stringify(createdAccounts, null, 2));

    const csvOutPath = path.join(
      outputDir,
      `test-credentials-${timestamp}.csv`,
    );
    const csvContent = ["Name,Email,Password,Type,Role"]
      .concat(
        createdAccounts.map(
          (a) =>
            `"${a.name}","${a.email}","${a.password}","${a.type}","${a.role}"`,
        ),
      )
      .join("\n");
    fs.writeFileSync(csvOutPath, csvContent);

    console.log("\n========================================");
    console.log("CREDENTIALS (save these securely!)");
    console.log("========================================\n");
    for (const account of createdAccounts) {
      console.log(`${account.name} (${account.type})`);
      console.log(`  Email:    ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log("");
    }

    console.log("========================================");
    console.log("FILES SAVED:");
    console.log(`  CSV:  ${csvOutPath}`);
    console.log(`  JSON: ${jsonOutPath}`);
    console.log("========================================");
  }

  console.log(`\nDone: ${createdAccounts.length} created, ${errors} errors`);
}

createTestAccounts().catch(console.error);
