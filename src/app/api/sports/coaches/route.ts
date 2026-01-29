import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List coaches
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'sports') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: sports } = await supabase
      .from('sports')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!sports) {
      return NextResponse.json({ error: "Sports team not found" }, { status: 404 });
    }

    const { data: coaches, error } = await supabase
      .from('sports_coaches')
      .select('*')
      .eq('sports_id', sports.id)
      .order('display_order')
      .order('added_at');

    if (error) {
      console.error("Get coaches error:", error);
      return NextResponse.json({ error: "Failed to get coaches" }, { status: 500 });
    }

    return NextResponse.json({ coaches: coaches || [] });
  } catch (error) {
    console.error("Get coaches error:", error);
    return NextResponse.json({ error: "Failed to get coaches" }, { status: 500 });
  }
}

// POST - Add a coach
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'sports') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, display_order } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Coach name is required" }, { status: 400 });
    }

    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      return NextResponse.json({ error: "Coach role is required" }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be 100 characters or less" }, { status: 400 });
    }

    if (role.trim().length > 100) {
      return NextResponse.json({ error: "Role must be 100 characters or less" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: sports } = await supabase
      .from('sports')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!sports) {
      return NextResponse.json({ error: "Sports team not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('sports_coaches')
      .insert({
        sports_id: sports.id,
        name: name.trim(),
        role: role.trim(),
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Add coach error:", error);
      return NextResponse.json({ error: "Failed to add coach" }, { status: 500 });
    }

    return NextResponse.json({ coach: data });
  } catch (error) {
    console.error("Add coach error:", error);
    return NextResponse.json({ error: "Failed to add coach" }, { status: 500 });
  }
}

// PUT - Update a coach
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'sports') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, role, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: sports } = await supabase
      .from('sports')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!sports) {
      return NextResponse.json({ error: "Sports team not found" }, { status: 404 });
    }

    // Verify coach belongs to this sports team
    const { data: coach } = await supabase
      .from('sports_coaches')
      .select('id, sports_id')
      .eq('id', id)
      .single();

    if (!coach || coach.sports_id !== sports.id) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (role !== undefined) updateData.role = String(role).trim();
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from('sports_coaches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Update coach error:", error);
      return NextResponse.json({ error: "Failed to update coach" }, { status: 500 });
    }

    return NextResponse.json({ coach: data });
  } catch (error) {
    console.error("Update coach error:", error);
    return NextResponse.json({ error: "Failed to update coach" }, { status: 500 });
  }
}

// DELETE - Remove a coach
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'sports') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const coachId = searchParams.get('id');

    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: sports } = await supabase
      .from('sports')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!sports) {
      return NextResponse.json({ error: "Sports team not found" }, { status: 404 });
    }

    // Verify coach belongs to this sports team
    const { data: coach } = await supabase
      .from('sports_coaches')
      .select('id, sports_id')
      .eq('id', coachId)
      .single();

    if (!coach || coach.sports_id !== sports.id) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from('sports_coaches')
      .delete()
      .eq('id', coachId);

    if (error) {
      console.error("Delete coach error:", error);
      return NextResponse.json({ error: "Failed to remove coach" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coach error:", error);
    return NextResponse.json({ error: "Failed to remove coach" }, { status: 500 });
  }
}
