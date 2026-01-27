import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get all manual members for a living group
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group" && user.role !== "admin" && !user.is_staph) {
      return NextResponse.json(
        { error: "Only living group accounts can access this resource" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Get all manual members
    const { data: members, error } = await supabase
      .from("living_group_manual_members")
      .select("id, name, section_name, added_at")
      .eq("living_group_id", livingGroup.id)
      .order("section_name")
      .order("name");

    if (error) {
      console.error("Get manual members error:", error);
      return NextResponse.json(
        { error: "Failed to get manual members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Get manual members error:", error);
    return NextResponse.json(
      { error: "Failed to get manual members" },
      { status: 500 }
    );
  }
}

// POST - Add a manual member name
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can add members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, section_name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Member name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedSection = section_name ? section_name.trim() : null;

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (trimmedSection && trimmedSection.length > 100) {
      return NextResponse.json(
        { error: "Section name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Add manual member
    const { data, error } = await supabase
      .from("living_group_manual_members")
      .insert({
        living_group_id: livingGroup.id,
        name: trimmedName,
        section_name: trimmedSection,
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

// PUT - Update a manual member (change section)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can update members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, section_name } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const trimmedSection = section_name ? section_name.trim() : null;

    if (trimmedSection && trimmedSection.length > 100) {
      return NextResponse.json(
        { error: "Section name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Verify member belongs to this living group
    const { data: member, error: memberError } = await supabase
      .from("living_group_manual_members")
      .select("id, living_group_id")
      .eq("id", id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    if (member.living_group_id !== livingGroup.id) {
      return NextResponse.json(
        { error: "Member does not belong to your living group" },
        { status: 403 }
      );
    }

    // Update the member
    const { data, error } = await supabase
      .from("living_group_manual_members")
      .update({ section_name: trimmedSection })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update member error:", error);
      return NextResponse.json(
        { error: "Failed to update member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
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

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can remove members" },
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

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    // Verify manual member belongs to this living group
    const { data: member, error: memberError } = await supabase
      .from("living_group_manual_members")
      .select("id, living_group_id")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Manual member not found" },
        { status: 404 }
      );
    }

    if (member.living_group_id !== livingGroup.id) {
      return NextResponse.json(
        { error: "Manual member does not belong to your living group" },
        { status: 403 }
      );
    }

    // Delete the manual member
    const { error } = await supabase
      .from("living_group_manual_members")
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
