/**
 * Download All Uploaded Images from Supabase Storage
 *
 * Downloads club and living group images with proper naming:
 *   Clubs: Organization_Name_Candid.ext, Organization_Name_Candid_2.ext, Organization_Name_Candid_3.ext
 *   Dorms: Organization_Name_Section_Name_Candid.ext
 *   FSILGs: Organization_Name_Candid.ext
 *
 * Usage:
 *   node scripts/download-images.js
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sanitize(name) {
  return name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
}

function getExt(url) {
  const match = url.match(/\.(\w+)(?:\?|$)/);
  return match ? match[1] : "jpg";
}

async function downloadFile(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
}

async function main() {
  const outDir = path.join(__dirname, "output", "downloaded-images");
  const clubsDir = path.join(outDir, "clubs");
  const lgDir = path.join(outDir, "living-groups");
  fs.mkdirSync(clubsDir, { recursive: true });
  fs.mkdirSync(lgDir, { recursive: true });

  let downloaded = 0;

  // --- Clubs ---
  console.log("Fetching clubs...");
  const { data: clubs, error: clubErr } = await supabase
    .from("clubs")
    .select("id, club_id, name, candid_image_1, candid_image_2, candid_image_3");

  if (clubErr) {
    console.error("Error fetching clubs:", clubErr.message);
  } else {
    for (const club of clubs) {
      const name = sanitize(club.name || club.club_id || club.id);
      for (let slot = 1; slot <= 3; slot++) {
        const url = club[`candid_image_${slot}`];
        if (!url) continue;
        const suffix = slot === 1 ? "" : `_${slot}`;
        const ext = getExt(url);
        const filename = `${name}_Candid${suffix}.${ext}`;
        const filepath = path.join(clubsDir, filename);
        try {
          await downloadFile(url, filepath);
          console.log(`  ✓ ${filename}`);
          downloaded++;
        } catch (e) {
          console.error(`  ✗ ${filename}: ${e.message}`);
        }
      }
    }
  }

  // --- Living Groups ---
  console.log("Fetching living groups...");
  const { data: lgs, error: lgErr } = await supabase
    .from("living_groups")
    .select("id, name, living_group_type, section_images");

  if (lgErr) {
    console.error("Error fetching living groups:", lgErr.message);
  } else {
    for (const lg of lgs) {
      const images = lg.section_images;
      if (!images || typeof images !== "object") continue;
      const orgName = sanitize(lg.name || lg.id);
      const isDorm = lg.living_group_type === "dorm";

      for (const [sectionName, url] of Object.entries(images)) {
        if (!url) continue;
        const ext = getExt(url);
        const filename = isDorm
          ? `${orgName}_${sanitize(sectionName)}_Candid.${ext}`
          : `${orgName}_Candid.${ext}`;
        const filepath = path.join(lgDir, filename);
        try {
          await downloadFile(url, filepath);
          console.log(`  ✓ ${filename}`);
          downloaded++;
        } catch (e) {
          console.error(`  ✗ ${filename}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\nDone. Downloaded ${downloaded} image(s) to ${outDir}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
