// Quick debug script - run with: node scripts/debug-orgs.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check new FSILGs
  const newFsilgNames = [
    "Phi Beta Sigma (Sigmas)",
    "Phi Kappa Psi (Phi Psi)",
    "Lambda Upsilon Lambda",
    "Interfraternity Council (IFC)",
    "Panhellenic Council (Panhel)",
  ];

  console.log("=== Checking new FSILGs in living_groups table ===");
  for (const name of newFsilgNames) {
    const { data, error } = await supabase
      .from("living_groups")
      .select("id, name, status")
      .eq("name", name)
      .maybeSingle();

    if (data) {
      console.log(`✓ ${name}: status=${data.status}`);
    } else {
      console.log(`✗ ${name}: NOT FOUND`);
    }
  }

  // Count totals
  const { count: lgCount } = await supabase.from("living_groups").select("*", { count: "exact", head: true });
  const { count: clubCount } = await supabase.from("clubs").select("*", { count: "exact", head: true });

  console.log(`\n=== Totals ===`);
  console.log(`Living groups: ${lgCount}`);
  console.log(`Clubs: ${clubCount}`);
}

main().catch(console.error);
