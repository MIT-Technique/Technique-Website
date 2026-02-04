import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('sports')))) {
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
      .select('sports_id, name, role, team')
      .in('sports_id', sportIds)
      .order('name', { ascending: true });

    const { data: coaches } = await supabase
      .from('sports_coaches')
      .select('sports_id, name, role, display_order')
      .in('sports_id', sportIds)
      .order('display_order', { ascending: true });

    // Build columns: for gender teams, create separate columns
    type Column = { header: string; entries: string[] };
    const columns: Column[] = [];

    const formatCoach = (c: { name: string; role?: string | null }) =>
      c.role ? `${c.name} (${c.role})` : c.name;

    const formatMember = (m: { name: string; role?: string | null }) =>
      m.role ? `${m.name} (${m.role})` : m.name;

    (sports || []).forEach(sport => {
      const sportCoaches = (coaches || []).filter(c => c.sports_id === sport.id).map(formatCoach);
      const sportMembers = (members || []).filter(m => m.sports_id === sport.id);

      if (sport.has_gender_teams) {
        const mensMembers = sportMembers.filter(m => m.team === 'mens').map(formatMember);
        const womensMembers = sportMembers.filter(m => m.team === 'womens').map(formatMember);
        columns.push({ header: `${sport.name} (Men's)`, entries: [...sportCoaches, ...mensMembers] });
        columns.push({ header: `${sport.name} (Women's)`, entries: [...sportCoaches, ...womensMembers] });
      } else {
        const allMembers = sportMembers.map(formatMember);
        columns.push({ header: sport.name, entries: [...sportCoaches, ...allMembers] });
      }
    });

    const maxMembers = Math.max(...columns.map(c => c.entries.length), 0);

    const rows: string[][] = [];
    rows.push(columns.map(c => c.header));

    for (let i = 0; i < maxMembers; i++) {
      rows.push(columns.map(c => c.entries[i] || ''));
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
