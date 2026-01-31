import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: bios, error } = await supabase
      .from('senior_bios')
      .select('first_name, last_name, major, second_major, minor, quote, achievements')
      .order('last_name', { ascending: true });

    if (error) {
      console.error("Error fetching senior bios:", error);
      return NextResponse.json({ error: "Failed to fetch bios" }, { status: 500 });
    }

    const headers = ['first_name', 'last_name', 'major', 'second_major', 'minor', 'quote', 'achievements'];

    const rows: string[][] = [headers];
    (bios || []).forEach(bio => {
      rows.push(headers.map(h => (bio as Record<string, string | null>)[h] || ''));
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
