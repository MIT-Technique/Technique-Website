import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

// GET - Fetch available years or check specific year
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const availableOnly = searchParams.get('available') === 'true';

    const supabase = createAdminClient();

    if (year) {
      // Check specific year availability
      const { data, error } = await supabase
        .from('yearbook_inventory')
        .select('year, quantity')
        .eq('year', parseInt(year))
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching inventory:", error);
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
      }

      const quantity = data?.quantity || 0;
      return NextResponse.json({
        year: parseInt(year),
        available: quantity > 0,
      });
    }

    // Fetch available years only (for dropdown)
    if (availableOnly) {
      const { data, error } = await supabase
        .from('yearbook_inventory')
        .select('year')
        .gt('quantity', 0)
        .order('year', { ascending: false });

      if (error) {
        console.error("Error fetching available years:", error);
        return NextResponse.json({ error: "Failed to fetch available years" }, { status: 500 });
      }

      return NextResponse.json({ years: (data || []).map(d => d.year) });
    }

    // Fetch all inventory (for admin)
    const { data, error } = await supabase
      .from('yearbook_inventory')
      .select('year, quantity, updated_at')
      .order('year', { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error);
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }

    return NextResponse.json({ inventory: data || [] });
  } catch (error) {
    console.error("Error in yearbook inventory GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
