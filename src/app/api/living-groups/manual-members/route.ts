import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { parseBulkNames } from "../../../../lib/utils/nameParser";

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

// POST - Add a manual member name (single or bulk)
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
    const { name, bulkText, section_name } = body;

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

    const trimmedSection = section_name ? String(section_name).trim() : null;

    if (trimmedSection && trimmedSection.length > 100) {
      return NextResponse.json(
        { error: "Section name must be 100 characters or less" },
        { status: 400 }
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
        .from("living_group_manual_members")
        .select("name")
        .eq("living_group_id", livingGroup.id);

      const duplicates: string[] = [];
      const toInsert = parseResult.success.filter((parsed) => {
        const isDuplicate = existingMembers?.some(
          (existing) =>
            existing.name.toLowerCase() === parsed.name.toLowerCase()
        );
        if (isDuplicate) {
          duplicates.push(parsed.name);
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
        .from("living_group_manual_members")
        .insert(
          toInsert.map((parsed) => ({
            living_group_id: livingGroup.id,
            section_name: trimmedSection,
            name: parsed.name,
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
    if (name === undefined) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();

    if (!trimmedName || trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 200) {
      return NextResponse.json(
        { error: "Name must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: duplicate } = await supabase
      .from("living_group_manual_members")
      .select("id")
      .eq("living_group_id", livingGroup.id)
      .eq("name", trimmedName)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "This member already exists" },
        { status: 400 }
      );
    }

    // Add manual member
    const { data, error } = await supabase
      .from("living_group_manual_members")
      .insert({
        living_group_id: livingGroup.id,
        section_name: trimmedSection,
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

// DELETE - Remove a manual member or bulk delete members
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
    const bulkDelete = searchParams.get("bulk");
    const sectionName = searchParams.get("section");

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

    // BULK DELETE MODE
    if (bulkDelete === "true") {
      // First, get the members that will be deleted (for revert functionality)
      let query = supabase
        .from("living_group_manual_members")
        .select("*")
        .eq("living_group_id", livingGroup.id);

      // If section is specified and not "all", filter by section
      if (sectionName && sectionName !== "all") {
        query = query.eq("section_name", sectionName);
      }

      const { data: deletedMembers, error: fetchError } = await query;

      if (fetchError) {
        console.error("Fetch members for bulk delete error:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch members" },
          { status: 500 }
        );
      }

      // Now delete the members
      let deleteQuery = supabase
        .from("living_group_manual_members")
        .delete()
        .eq("living_group_id", livingGroup.id);

      // If section is specified and not "all", filter by section
      if (sectionName && sectionName !== "all") {
        deleteQuery = deleteQuery.eq("section_name", sectionName);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error("Bulk delete error:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete members" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        deletedCount: deletedMembers?.length || 0,
        deletedMembers: deletedMembers || [],
      });
    }

    // SINGLE DELETE MODE
    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
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
