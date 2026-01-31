/**
 * Create Organization Auth Accounts from CSV
 *
 * Reads org data from a CSV file, creates Supabase auth accounts
 * with unique passwords, and exports credentials for distribution.
 *
 * Usage:
 *   node scripts/create-org-accounts.js path/to/orgs.csv
 *
 * Input CSV format:
 *   name,email,type
 *   "MIT Debate Society",debate@mit.edu,club
 *   "Baker House",baker@mit.edu,living_group
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

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/create-org-accounts.js <path-to-csv>");
  console.error(
    '\nCSV format: name,email,type (type = club | living_group | fsilg)',
  );
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Error: File not found: ${csvPath}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const VALID_TYPES = ["club", "living_group", "fsilg"];

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    console.error("Error: CSV must have a header row and at least one data row");
    process.exit(1);
  }

  // Skip header row
  const orgs = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length < 3) {
      console.error(`Warning: Skipping malformed line ${i + 1}: ${line}`);
      continue;
    }

    const [name, email, type] = fields;

    if (!VALID_TYPES.includes(type)) {
      console.error(
        `Warning: Skipping line ${i + 1}: invalid type "${type}" (must be ${VALID_TYPES.join(", ")})`,
      );
      continue;
    }

    orgs.push({ name, email: email.toLowerCase(), type });
  }

  return orgs;
}

function generateUniquePassword(name) {
  const hash = crypto
    .createHash("sha256")
    .update(name + Date.now().toString() + crypto.randomBytes(8).toString("hex"))
    .digest("hex")
    .slice(0, 12);
  return `TNQ-${hash}`;
}

function getRoleForType(type) {
  if (type === "club") return "club";
  return "living_group"; // both living_group and fsilg
}

async function createOrgAccounts() {
  const orgs = parseCSV(csvPath);
  console.log(`Found ${orgs.length} organizations in CSV\n`);

  const createdAccounts = [];
  let skipped = 0;
  let errors = 0;

  for (const org of orgs) {
    try {
      const uniquePassword = generateUniquePassword(org.name);
      const role = getRoleForType(org.type);

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: org.email,
          password: uniquePassword,
          email_confirm: true,
          user_metadata: {
            name: org.name,
            role,
          },
        });

      if (authError) {
        if (authError.message.includes("already exists")) {
          console.log(`-- ${org.name}: Account already exists`);
          skipped++;
        } else {
          console.error(`XX ${org.name}: ${authError.message}`);
          errors++;
        }
        continue;
      }

      // Link auth user to public.users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ supabase_auth_id: authData.user.id })
        .eq("email", org.email);

      if (updateError) {
        console.error(
          `XX ${org.name}: Failed to link auth user - ${updateError.message}`,
        );
        errors++;
      } else {
        console.log(`OK ${org.name}`);
        createdAccounts.push({
          name: org.name,
          email: org.email,
          password: uniquePassword,
          type: org.type,
        });
      }
    } catch (error) {
      console.error(`XX ${org.name}: ${error.message}`);
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
      `org-credentials-${timestamp}.csv`,
    );
    const csvContent = ["Organization,Email,Password,Type"]
      .concat(
        createdAccounts.map(
          (a) => `"${a.name}","${a.email}","${a.password}","${a.type}"`,
        ),
      )
      .join("\n");
    fs.writeFileSync(csvOutPath, csvContent);

    console.log(`\nCredentials saved to: ${csvOutPath}`);
  }

  console.log(
    `\nDone: ${createdAccounts.length} created, ${skipped} skipped, ${errors} errors`,
  );
}

createOrgAccounts().catch(console.error);
