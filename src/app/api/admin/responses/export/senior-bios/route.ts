import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('seniors')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const PAGE_SIZE = 1000;
    let allBios: any[] = [];
    let from = 0;

    while (true) {
      const { data: bios, error } = await supabase
        .from('senior_bios')
        .select('first_name, last_name, email, major, second_major, minor, quote, achievements, photo_preference')
        .order('last_name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching senior bios:", error);
        return NextResponse.json({ error: "Failed to fetch bios" }, { status: 500 });
      }

      allBios = allBios.concat(bios || []);
      if (!bios || bios.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const fields = ['first_name', 'last_name', 'email', 'major', 'second_major', 'minor', 'quote', 'achievements', 'photo_preference'];

    // Transposed: each submission is a column, fields are rows
    const rows: string[][] = [];
    fields.forEach(field => {
      const row = [field, ...allBios.map(bio => (bio as Record<string, string | null>)[field] || '')];
      rows.push(row);
    });

    const csv = rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="senior-bios.csv"',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
