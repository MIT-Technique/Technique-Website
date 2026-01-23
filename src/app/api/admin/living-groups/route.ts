import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List all living groups
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Allow admin and staph roles
    if (!user || (user.role !== 'admin' && user.role !== 'staph')) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const includeMembers = searchParams.get('includeMembers') === 'true';

    let query = supabase
      .from('living_groups')
      .select(`
        *,
        user:users(id, email, first_name, last_name),
        photoshoot_time:photoshoot_times(id, date, start_time, end_time)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: livingGroups, error } = await query;

    if (error) {
      console.error("Error fetching living groups:", error);
      return NextResponse.json(
        { error: "Failed to fetch living groups" },
        { status: 500 }
      );
    }

    // If includeMembers flag is set, fetch member counts and expected counts
    if (includeMembers && livingGroups) {
      const enrichedLivingGroups = await Promise.all(
        livingGroups.map(async (lg) => {
          // Get active member count
          const { count: memberCount } = await supabase
            .from('living_group_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('living_group_id', lg.id)
            .eq('status', 'active');

          // Get expected counts
          const { data: expectedCounts } = await supabase
            .from('section_expected_counts')
            .select('expected_count')
            .eq('living_group_id', lg.id);

          const totalExpected = (expectedCounts || []).reduce(
            (sum, ec) => sum + (ec.expected_count || 0),
            0
          );

          return {
            ...lg,
            memberCount: memberCount || 0,
            expectedCount: totalExpected,
          };
        })
      );

      return NextResponse.json({ livingGroups: enrichedLivingGroups });
    }

    return NextResponse.json({ livingGroups });
  } catch (error) {
    console.error("Error fetching living groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch living groups" },
      { status: 500 }
    );
  }
}

// POST - Promote a user to living group leader
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, livingGroupName } = body;

    if (!userId || !livingGroupName) {
      return NextResponse.json(
        { error: "User ID and living group name are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user exists and is not already an LGL
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.role === 'living_group_leader') {
      return NextResponse.json(
        { error: "User is already a living group leader" },
        { status: 409 }
      );
    }

    // Update user role to living_group_leader
    const { error: roleError } = await supabase
      .from('users')
      .update({
        role: 'living_group_leader',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (roleError) {
      console.error("Error updating user role:", roleError);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Create living group entry
    const { data: livingGroup, error: lgError } = await supabase
      .from('living_groups')
      .insert({
        user_id: userId,
        name: livingGroupName,
        status: 'active',
        promoted_by: user.id,
        promoted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (lgError) {
      console.error("Error creating living group:", lgError);
      // Rollback user role
      await supabase
        .from('users')
        .update({ role: 'student', updated_at: new Date().toISOString() })
        .eq('id', userId);

      return NextResponse.json(
        { error: "Failed to create living group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      livingGroup,
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}

// PUT - Enable/disable a living group
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { livingGroupId, action } = body;

    if (!livingGroupId) {
      return NextResponse.json(
        { error: "Living group ID is required" },
        { status: 400 }
      );
    }

    if (!['enable', 'disable'].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'enable' or 'disable'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      status: action === 'enable' ? 'active' : 'disabled',
      updated_at: new Date().toISOString(),
    };

    if (action === 'disable') {
      updateData.disabled_by = user.id;
      updateData.disabled_at = new Date().toISOString();
    }

    const { data: updatedLivingGroup, error } = await supabase
      .from('living_groups')
      .update(updateData)
      .eq('id', livingGroupId)
      .select()
      .single();

    if (error) {
      console.error("Error updating living group:", error);
      return NextResponse.json(
        { error: "Failed to update living group" },
        { status: 500 }
      );
    }

    return NextResponse.json({ livingGroup: updatedLivingGroup });
  } catch (error) {
    console.error("Error updating living group:", error);
    return NextResponse.json(
      { error: "Failed to update living group" },
      { status: 500 }
    );
  }
}
