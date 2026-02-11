import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

const DEFAULT_SECTION_KEY = "__default__";

// GET - Get sections for the living group
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
      .select("id, dorm_sections")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sections: livingGroup.dorm_sections || []
    });
  } catch (error) {
    console.error("Get sections error:", error);
    return NextResponse.json(
      { error: "Failed to get sections" },
      { status: 500 }
    );
  }
}

// POST - Add a section
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can manage sections" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { section_name } = body;

    if (!section_name || typeof section_name !== "string" || section_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 }
      );
    }

    const trimmedName = section_name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Section name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, dorm_sections")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    const currentSections = livingGroup.dorm_sections || [];

    // Check if section already exists
    if (currentSections.includes(trimmedName)) {
      return NextResponse.json(
        { error: "Section already exists" },
        { status: 400 }
      );
    }

    // Add new section
    const newSections = [...currentSections, trimmedName];

    const { error } = await supabase
      .from("living_groups")
      .update({ dorm_sections: newSections })
      .eq("id", livingGroup.id);

    if (error) {
      console.error("Add section error:", error);
      return NextResponse.json(
        { error: "Failed to add section" },
        { status: 500 }
      );
    }

    // If this is the first section and there's a default image, migrate it
    if (currentSections.length === 0) {
      const { data: lgData } = await supabase
        .from("living_groups")
        .select("name, living_group_type, section_images")
        .eq("id", livingGroup.id)
        .single();

      if (lgData) {
        const sectionImages = lgData.section_images || {};
        const defaultImageUrl = sectionImages[DEFAULT_SECTION_KEY];

        if (defaultImageUrl) {
          // Migrate default image to the new section
          const subfolder = lgData.living_group_type === 'fsilg' ? 'fsilgs' : 'dorms';
          const safeOrgName = (lgData.name || livingGroup.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
          const safeSectionName = trimmedName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

          // Extract file extension from URL
          const extMatch = defaultImageUrl.match(/\.(\w+)(?:\?|$)/);
          const fileExt = extMatch ? extMatch[1] : 'jpg';

          const oldPath = `${subfolder}/${safeOrgName}/Candid.${fileExt}`;
          const newPath = `${subfolder}/${safeOrgName}/${safeSectionName}_Candid.${fileExt}`;

          // Move file in storage
          await supabase.storage
            .from("living-group-images")
            .move(oldPath, newPath);

          // Get new public URL
          const { data: urlData } = supabase.storage
            .from("living-group-images")
            .getPublicUrl(newPath);

          // Update section_images JSONB
          delete sectionImages[DEFAULT_SECTION_KEY];
          sectionImages[trimmedName] = urlData.publicUrl;

          await supabase
            .from("living_groups")
            .update({ section_images: sectionImages })
            .eq("id", livingGroup.id);
        }
      }
    }

    return NextResponse.json({ sections: newSections });
  } catch (error) {
    console.error("Add section error:", error);
    return NextResponse.json(
      { error: "Failed to add section" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a section
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "living_group") {
      return NextResponse.json(
        { error: "Only living group accounts can manage sections" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sectionName = searchParams.get("name");

    if (!sectionName) {
      return NextResponse.json(
        { error: "Section name is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the living group for this user
    const { data: livingGroup, error: lgError } = await supabase
      .from("living_groups")
      .select("id, dorm_sections")
      .eq("user_id", user.id)
      .single();

    if (lgError || !livingGroup) {
      return NextResponse.json(
        { error: "Living group not found" },
        { status: 404 }
      );
    }

    const currentSections = livingGroup.dorm_sections || [];

    // Remove section
    const newSections = currentSections.filter((s: string) => s !== sectionName);

    const { error } = await supabase
      .from("living_groups")
      .update({ dorm_sections: newSections })
      .eq("id", livingGroup.id);

    if (error) {
      console.error("Remove section error:", error);
      return NextResponse.json(
        { error: "Failed to remove section" },
        { status: 500 }
      );
    }

    // Also clear section_name from any members in that section
    await supabase
      .from("living_group_manual_members")
      .update({ section_name: null })
      .eq("living_group_id", livingGroup.id)
      .eq("section_name", sectionName);

    // Delete time assignments for this section
    await supabase
      .from("living_group_time_assignments")
      .delete()
      .eq("living_group_id", livingGroup.id)
      .eq("section_name", sectionName);

    // Handle section image: migrate to default slot if last section, otherwise delete
    const { data: lgData } = await supabase
      .from("living_groups")
      .select("name, living_group_type, section_images")
      .eq("id", livingGroup.id)
      .single();

    if (lgData) {
      const sectionImages = lgData.section_images || {};
      const imageUrl = sectionImages[sectionName];

      if (imageUrl) {
        if (newSections.length === 0) {
          // Last section being removed - migrate image to default slot
          const subfolder = lgData.living_group_type === 'fsilg' ? 'fsilgs' : 'dorms';
          const safeOrgName = (lgData.name || livingGroup.id).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
          const safeSectionName = sectionName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

          // Extract file extension from URL
          const extMatch = imageUrl.match(/\.(\w+)(?:\?|$)/);
          const fileExt = extMatch ? extMatch[1] : 'jpg';

          const oldPath = `${subfolder}/${safeOrgName}/${safeSectionName}_Candid.${fileExt}`;
          const newPath = `${subfolder}/${safeOrgName}/Candid.${fileExt}`;

          // Move file in storage
          await supabase.storage
            .from("living-group-images")
            .move(oldPath, newPath);

          // Get new public URL
          const { data: urlData } = supabase.storage
            .from("living-group-images")
            .getPublicUrl(newPath);

          // Update section_images JSONB
          delete sectionImages[sectionName];
          sectionImages[DEFAULT_SECTION_KEY] = urlData.publicUrl;

          await supabase
            .from("living_groups")
            .update({ section_images: sectionImages })
            .eq("id", livingGroup.id);
        } else {
          // Not the last section - delete the image entirely
          const match = imageUrl.match(/\/living-group-images\/(.+)$/);
          if (match) {
            await supabase.storage
              .from("living-group-images")
              .remove([decodeURIComponent(match[1])]);
          }

          // Remove from section_images JSONB
          delete sectionImages[sectionName];

          await supabase
            .from("living_groups")
            .update({ section_images: sectionImages })
            .eq("id", livingGroup.id);
        }
      }
    }

    return NextResponse.json({ sections: newSections });
  } catch (error) {
    console.error("Remove section error:", error);
    return NextResponse.json(
      { error: "Failed to remove section" },
      { status: 500 }
    );
  }
}
