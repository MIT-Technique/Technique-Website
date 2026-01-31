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

    const { data: sports } = await supabase
      .from('sports')
      .select('id, name, has_gender_teams')
      .order('name', { ascending: true });

    const sportIds = (sports || []).map(s => s.id);

    const { data: members } = await supabase
      .from('sports_manual_members')
      .select('sports_id, first_name, last_name, team')
      .in('sports_id', sportIds)
      .order('last_name', { ascending: true });

    // Build columns: for gender teams, create separate columns
    type Column = { header: string; members: string[] };
    const columns: Column[] = [];

    (sports || []).forEach(sport => {
      const sportMembers = (members || []).filter(m => m.sports_id === sport.id);

      if (sport.has_gender_teams) {
        const mensMembers = sportMembers.filter(m => m.team === 'mens').map(m => `${m.first_name} ${m.last_name}`);
        const womensMembers = sportMembers.filter(m => m.team === 'womens').map(m => `${m.first_name} ${m.last_name}`);
        columns.push({ header: `${sport.name} (Men's)`, members: mensMembers });
        columns.push({ header: `${sport.name} (Women's)`, members: womensMembers });
      } else {
        const allMembers = sportMembers.map(m => `${m.first_name} ${m.last_name}`);
        columns.push({ header: sport.name, members: allMembers });
      }
    });

    const maxMembers = Math.max(...columns.map(c => c.members.length), 0);

    const rows: string[][] = [];
    rows.push(columns.map(c => c.header));

    for (let i = 0; i < maxMembers; i++) {
      rows.push(columns.map(c => c.members[i] || ''));
    }

    const csv = rows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sport-members.csv"',
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
