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

    const { data: lgs } = await supabase
      .from('living_groups')
      .select('id, name')
      .order('name', { ascending: true });

    const lgIds = (lgs || []).map(lg => lg.id);

    const { data: members } = await supabase
      .from('living_group_manual_members')
      .select('living_group_id, first_name, last_name')
      .in('living_group_id', lgIds)
      .order('last_name', { ascending: true });

    const membersByLG: Record<string, string[]> = {};
    (lgs || []).forEach(lg => { membersByLG[lg.id] = []; });
    (members || []).forEach(m => {
      if (membersByLG[m.living_group_id]) {
        membersByLG[m.living_group_id].push(`${m.first_name} ${m.last_name}`);
      }
    });

    const lgList = lgs || [];
    const maxMembers = Math.max(...lgList.map(lg => membersByLG[lg.id].length), 0);

    const rows: string[][] = [];
    rows.push(lgList.map(lg => lg.name || 'Unnamed'));

    for (let i = 0; i < maxMembers; i++) {
      rows.push(lgList.map(lg => membersByLG[lg.id][i] || ''));
    }

    const csv = rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="lg-members.csv"',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
