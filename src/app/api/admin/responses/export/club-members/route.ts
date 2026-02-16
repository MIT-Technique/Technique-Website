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
      .select('id, name, description, candid_image_1, candid_image_2, candid_image_3')
      .order('name', { ascending: true });

    const clubIds = (clubs || []).map(c => c.id);

    const { data: members } = await supabase
      .from('club_manual_members')
      .select('club_id, name, role')
      .in('club_id', clubIds)
      .order('name', { ascending: true });

    // Group members by club
    const membersByClub: Record<string, string[]> = {};
    (clubs || []).forEach(c => { membersByClub[c.id] = []; });
    (members || []).forEach(m => {
      if (membersByClub[m.club_id]) {
        membersByClub[m.club_id].push(m.role ? `${m.name} (${m.role})` : m.name);
      }
    });

    // Filter clubs: exclude those with no description, no members, and no images
    const allClubs = clubs || [];
    const hasImages = (c: any) => !!(c.candid_image_1 || c.candid_image_2 || c.candid_image_3);
    const hasContent = (c: any) => !!(c.description || membersByClub[c.id].length > 0);

    const fullClubs = allClubs.filter(c => hasContent(c));
    const imageOnlyClubs = allClubs.filter(c => !hasContent(c) && hasImages(c));
    // Clubs with nothing are excluded entirely

    const clubList = [...fullClubs, ...imageOnlyClubs];
    const maxMembers = Math.max(...fullClubs.map(c => membersByClub[c.id].length), 0);

    const rows: string[][] = [];
    // Header row
    rows.push(clubList.map(c => c.name || 'Unnamed'));
    // Description row: image-only clubs get "has_image"
    rows.push(clubList.map(c =>
      imageOnlyClubs.includes(c) ? 'has_image' : (c.description || '')
    ));

    for (let i = 0; i < maxMembers; i++) {
      rows.push(clubList.map(c => membersByClub[c.id]?.[i] || ''));
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
