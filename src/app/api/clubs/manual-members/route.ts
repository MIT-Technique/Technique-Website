import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// POST - Add a manual member name
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can add manual members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Member name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID for current user
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Add manual member
    const { data, error } = await supabase
      .from('club_manual_members')
      .insert({
        club_id: club.id,
        name: trimmedName,
      })
      .select()
      .single();

    if (error) {
      console.error("Add manual member error:", error);
      return NextResponse.json(
        { error: "Failed to add manual member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("Add manual member error:", error);
    return NextResponse.json(
      { error: "Failed to add manual member" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a manual member
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'club') {
      return NextResponse.json(
        { error: "Only club accounts can remove manual members" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID for current user
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Verify manual member belongs to this club
    const { data: member, error: memberError } = await supabase
      .from('club_manual_members')
      .select('id, club_id')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Manual member not found" },
        { status: 404 }
      );
    }

    if (member.club_id !== club.id) {
      return NextResponse.json(
        { error: "Manual member does not belong to your club" },
        { status: 403 }
      );
    }

    // Delete the manual member
    const { error } = await supabase
      .from('club_manual_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error("Delete manual member error:", error);
      return NextResponse.json(
        { error: "Failed to remove manual member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove manual member error:", error);
    return NextResponse.json(
      { error: "Failed to remove manual member" },
      { status: 500 }
    );
  }
}
