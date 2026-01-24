import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// Helper to get club ID for either club account or club leader
async function getClubIdForUser(
  user: { id: string; role: string },
  supabase: ReturnType<typeof createAdminClient>,
  clubIdParam?: string | null
): Promise<{ clubId: string | null; error?: string }> {
  // If clubId is provided (for leaders), verify they're a leader of that club
  if (clubIdParam) {
    const { data: membership } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubIdParam)
      .eq("user_id", user.id)
      .eq("role", "leader")
      .single();

    if (membership) {
      return { clubId: clubIdParam };
    }

    // Also check if they're the club account owner
    if (user.role === "club") {
      const { data: club } = await supabase
        .from("clubs")
        .select("id")
        .eq("id", clubIdParam)
        .eq("user_id", user.id)
        .single();

      if (club) {
        return { clubId: clubIdParam };
      }
    }

    return { clubId: null, error: "You are not a leader of this club" };
  }

  // For club accounts without clubId param, get their club
  if (user.role === "club") {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (club) {
      return { clubId: club.id };
    }
    return { clubId: null, error: "Club not found" };
  }

  return {
    clubId: null,
    error: "Only club accounts and club leaders can access this resource",
  };
}

// POST - Add a manual member name
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, clubId: clubIdParam } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
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

    // Get club ID (either from param for leaders, or from user account)
    const { clubId, error: clubIdError } = await getClubIdForUser(
      user,
      supabase,
      clubIdParam
    );

    if (!clubId || clubIdError) {
      return NextResponse.json(
        { error: clubIdError || "Club not found" },
        { status: 403 }
      );
    }

    // Add manual member
    const { data, error } = await supabase
      .from("club_manual_members")
      .insert({
        club_id: clubId,
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get("id");
    const clubIdParam = searchParams.get("clubId");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get club ID (either from param for leaders, or from user account)
    const { clubId, error: clubIdError } = await getClubIdForUser(
      user,
      supabase,
      clubIdParam
    );

    if (!clubId || clubIdError) {
      return NextResponse.json(
        { error: clubIdError || "Club not found" },
        { status: 403 }
      );
    }

    // Verify manual member belongs to this club
    const { data: member, error: memberError } = await supabase
      .from("club_manual_members")
      .select("id, club_id")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Manual member not found" },
        { status: 404 }
      );
    }

    if (member.club_id !== clubId) {
      return NextResponse.json(
        { error: "Manual member does not belong to your club" },
        { status: 403 }
      );
    }

    // Delete the manual member
    const { error } = await supabase
      .from("club_manual_members")
      .delete()
      .eq("id", memberId);

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
