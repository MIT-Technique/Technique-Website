import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('clubs')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: clubs } = await supabase
      .from('clubs')
      .select('id, name')
      .order('name', { ascending: true });

    const clubIds = (clubs || []).map(c => c.id);

    const { data: members } = await supabase
      .from('club_manual_members')
      .select('club_id, name')
      .in('club_id', clubIds)
      .order('name', { ascending: true });

    // Group members by club
    const membersByClub: Record<string, string[]> = {};
    (clubs || []).forEach(c => { membersByClub[c.id] = []; });
    (members || []).forEach(m => {
      if (membersByClub[m.club_id]) {
        membersByClub[m.club_id].push(m.name);
      }
    });

    // Build CSV: club names as headers, members below
    const clubList = clubs || [];
    const maxMembers = Math.max(...clubList.map(c => membersByClub[c.id].length), 0);

    const rows: string[][] = [];
    // Header row
    rows.push(clubList.map(c => c.name || 'Unnamed'));

    for (let i = 0; i < maxMembers; i++) {
      rows.push(clubList.map(c => membersByClub[c.id][i] || ''));
    }

    const csv = rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="club-members.csv"',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
