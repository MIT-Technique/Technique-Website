import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getCurrentUser } from "../../../../lib/auth/session";

// GET - Fetch all yearbook inventory (admin only)
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('yearbook_inventory')
      .select('id, year, quantity, updated_at')
      .order('year', { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error);
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }

    return NextResponse.json({ inventory: data || [] });
  } catch (error) {
    console.error("Error in admin yearbook inventory GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update yearbook inventory quantity (admin only)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, quantity } = body;

    if (!year || typeof year !== 'number') {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upsert inventory record
    const { error } = await supabase
      .from('yearbook_inventory')
      .upsert({
        year,
        quantity,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: 'year' });

    if (error) {
      console.error("Error updating inventory:", error);
      return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin yearbook inventory PUT:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new year to inventory (admin only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, quantity } = body;

    if (!year || typeof year !== 'number') {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('yearbook_inventory')
      .insert({
        year,
        quantity: quantity || 0,
        updated_by: user.id,
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "Year already exists" }, { status: 400 });
      }
      console.error("Error adding inventory:", error);
      return NextResponse.json({ error: "Failed to add inventory" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin yearbook inventory POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
