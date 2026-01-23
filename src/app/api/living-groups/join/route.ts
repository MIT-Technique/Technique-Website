import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "../../../../lib/auth/session";

interface JoinRequest {
  livingGroupId: string;
  sectionId?: string; // Required for dorms, null for FSILGs
}

// POST /api/living-groups/join
// Join a living group (dorm: instant, FSILG: pending approval)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can join living groups
    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can join living groups" },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body: JoinRequest = await request.json();
    const { livingGroupId, sectionId } = body;

    if (!livingGroupId) {
      return NextResponse.json(
        { error: "Living group ID is required" },
        { status: 400 }
      );
    }

    // Get the living group to determine type
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, name, living_group_type, status")
      .eq("id", livingGroupId)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    if (livingGroup.status !== "active") {
      return NextResponse.json(
        { error: "This living group is not accepting new members" },
        { status: 400 }
      );
    }

    const membershipType = livingGroup.living_group_type;

    // For dorms, section is required
    if (membershipType === "dorm" && !sectionId) {
      return NextResponse.json(
        { error: "Section is required for dorm membership" },
        { status: 400 }
      );
    }

    // Validate section belongs to the correct dorm
    if (sectionId) {
      const { data: section, error: sectionError } = await supabase
        .from("dorm_sections")
        .select("id, dorm_name")
        .eq("id", sectionId)
        .single();

      if (sectionError || !section) {
        return NextResponse.json(
          { error: "Invalid section" },
          { status: 400 }
        );
      }

      // Verify section belongs to the living group's dorm
      if (section.dorm_name !== livingGroup.name) {
        return NextResponse.json(
          { error: "Section does not belong to this dorm" },
          { status: 400 }
        );
      }
    }

    // Check if user already has an active membership of this type
    const { data: existingMembership } = await supabase
      .from("living_group_memberships")
      .select("id, living_group_id, status")
      .eq("user_id", session.user.id)
      .eq("membership_type", membershipType)
      .in("status", ["active", "pending"])
      .maybeSingle();

    if (existingMembership) {
      const typeLabel = membershipType === "dorm" ? "dorm" : "FSILG";
      if (existingMembership.status === "pending") {
        return NextResponse.json(
          { error: `You already have a pending ${typeLabel} membership request` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `You are already a member of a ${typeLabel}. Please leave first.` },
        { status: 400 }
      );
    }

    // Create membership
    // - Dorms: status = 'active' (instant join)
    // - FSILGs: status = 'pending' (requires approval)
    const status = membershipType === "dorm" ? "active" : "pending";

    const { data: membership, error: insertError } = await supabase
      .from("living_group_memberships")
      .insert({
        living_group_id: livingGroupId,
        user_id: session.user.id,
        section_id: sectionId || null,
        membership_type: membershipType,
        status,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Join living group error:", insertError);

      // Handle unique constraint violations
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You already have a membership of this type" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to join living group" },
        { status: 500 }
      );
    }

    const message = membershipType === "dorm"
      ? "Successfully joined the dorm"
      : "Join request submitted. Waiting for approval.";

    return NextResponse.json({
      success: true,
      message,
      membership,
      isPending: status === "pending",
    });
  } catch (error) {
    console.error("Join living group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
