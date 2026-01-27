import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { parseBulkNames } from "../../../../lib/utils/nameParser";

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

// GET - Fetch all manual members for a club (sorted by last name, first name)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clubIdParam = searchParams.get("clubId");

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

    // Fetch members sorted by last name, then first name
    const { data: members, error } = await supabase
      .from("club_manual_members")
      .select("*")
      .eq("club_id", clubId)
      .order("last_name")
      .order("first_name");

    if (error) {
      console.error("Get members error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST - Add a manual member name (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      bulkText,
      clubId: clubIdParam,
    } = body;

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

    // BULK IMPORT MODE
    if (bulkText) {
      const parseResult = parseBulkNames(bulkText);

      if (parseResult.errors.length > 0 && parseResult.success.length === 0) {
        return NextResponse.json(
          {
            error: "All names failed to parse",
            parseErrors: parseResult.errors,
          },
          { status: 400 }
        );
      }

      // Check for duplicates against existing members
      const { data: existingMembers } = await supabase
        .from("club_manual_members")
        .select("first_name, last_name")
        .eq("club_id", clubId);

      const duplicates: string[] = [];
      const toInsert = parseResult.success.filter((parsed) => {
        const isDuplicate = existingMembers?.some(
          (existing) =>
            existing.first_name.toLowerCase() === parsed.firstName.toLowerCase() &&
            existing.last_name.toLowerCase() === parsed.lastName.toLowerCase()
        );
        if (isDuplicate) {
          duplicates.push(`${parsed.firstName} ${parsed.lastName}`.trim());
        }
        return !isDuplicate;
      });

      if (toInsert.length === 0) {
        return NextResponse.json(
          {
            error: "No new members to add (all duplicates or parse errors)",
            duplicates,
            parseErrors: parseResult.errors,
          },
          { status: 400 }
        );
      }

      // Bulk insert
      const { data, error } = await supabase
        .from("club_manual_members")
        .insert(
          toInsert.map((parsed) => ({
            club_id: clubId,
            first_name: parsed.firstName,
            last_name: parsed.lastName,
            name: parsed.firstName
              ? `${parsed.lastName}, ${parsed.firstName}`
              : parsed.lastName,
          }))
        )
        .select();

      if (error) {
        console.error("Bulk insert error:", error);
        return NextResponse.json(
          { error: "Failed to add members" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        members: data,
        count: data.length,
        parseErrors: parseResult.errors,
        duplicates,
      });
    }

    // SINGLE ADD MODE
    if (firstName === undefined || lastName === undefined) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const trimmedFirst = String(firstName).trim();
    const trimmedLast = String(lastName).trim();

    if (!trimmedLast || trimmedLast.length === 0) {
      return NextResponse.json(
        { error: "Last name is required" },
        { status: 400 }
      );
    }

    if (trimmedFirst.length > 100 || trimmedLast.length > 100) {
      return NextResponse.json(
        { error: "Name fields must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: duplicate } = await supabase
      .from("club_manual_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("first_name", trimmedFirst)
      .eq("last_name", trimmedLast)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "This member already exists" },
        { status: 400 }
      );
    }

    // Add manual member
    const { data, error } = await supabase
      .from("club_manual_members")
      .insert({
        club_id: clubId,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        name: trimmedFirst
          ? `${trimmedLast}, ${trimmedFirst}`
          : trimmedLast,
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
