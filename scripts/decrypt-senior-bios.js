/**
 * One-time migration script to decrypt encrypted first_name/last_name
 * values in the senior_bios table.
 *
 * Usage: node scripts/decrypt-senior-bios.js
 *
 * Requires .env with CRYPTR_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config();
const Cryptr = require('cryptr');
const { createClient } = require('@supabase/supabase-js');

const cryptr = new Cryptr(process.env.CRYPTR_SECRET);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isEncrypted(value) {
  if (!value || value.length < 50) return false;
  // Encrypted values are long hex strings
  return /^[0-9a-f]{50,}$/i.test(value);
}

function tryDecrypt(value) {
  try {
    return cryptr.decrypt(value);
  } catch {
    console.warn(`  Failed to decrypt: ${value.substring(0, 30)}...`);
    return null;
  }
}

async function main() {
  // Fetch all bios with pagination (Supabase default limit is 1000)
  let allBios = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data: bios, error } = await supabase
      .from('senior_bios')
      .select('id, email, first_name, last_name')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching bios:', error);
      process.exit(1);
    }

    allBios = allBios.concat(bios);
    if (bios.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Found ${allBios.length} senior bios`);

  let updated = 0;
  for (const bio of allBios) {
    const updates = {};

    if (isEncrypted(bio.first_name)) {
      const decrypted = tryDecrypt(bio.first_name);
      if (decrypted) updates.first_name = decrypted;
    }

    if (isEncrypted(bio.last_name)) {
      const decrypted = tryDecrypt(bio.last_name);
      if (decrypted) updates.last_name = decrypted;
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Decrypting ${bio.email}: ${JSON.stringify(updates)}`);
      const { error: updateError } = await supabase
        .from('senior_bios')
        .update(updates)
        .eq('id', bio.id);

      if (updateError) {
        console.error(`  Error updating ${bio.email}:`, updateError);
      } else {
        updated++;
      }
    }
  }

  console.log(`Done. Updated ${updated} of ${allBios.length} bios.`);
}

main();
