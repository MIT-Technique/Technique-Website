import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { ApprovalStatus } from "../../../../lib/supabase/types";

// GET - List all clubs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('clubs')
      .select(`
        *,
        user:users(id, email, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('approval_status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,club_id.ilike.%${search}%`);
    }

    const { data: clubs, error } = await query;

    if (error) {
      console.error("Error fetching clubs:", error);
      return NextResponse.json(
        { error: "Failed to fetch clubs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clubs });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}

// PUT - Approve or deny a club
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
    const { clubId, action, notes } = body;

    if (!clubId) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 }
      );
    }

    const validActions: ApprovalStatus[] = ['approved', 'denied', 'pending'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approved', 'denied', or 'pending'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      approval_status: action,
      approval_notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    if (action === 'approved' || action === 'denied') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updatedClub, error } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', clubId)
      .select()
      .single();

    if (error) {
      console.error("Error updating club:", error);
      return NextResponse.json(
        { error: "Failed to update club" },
        { status: 500 }
      );
    }

    return NextResponse.json({ club: updatedClub });
  } catch (error) {
    console.error("Error updating club:", error);
    return NextResponse.json(
      { error: "Failed to update club" },
      { status: 500 }
    );
  }
}
