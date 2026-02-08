import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && !(user.is_staph && user.access?.includes('seniors')))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const PAGE_SIZE = 1000;
    let allBios: any[] = [];
    let from = 0;

    while (true) {
      const { data: bios, error } = await supabase
        .from('senior_bios')
        .select('id, first_name, last_name, email, major, minor, second_major, quote, achievements')
        .order('last_name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error("Error fetching senior bios:", error);
        return NextResponse.json({ error: "Failed to fetch senior bios" }, { status: 500 });
      }

      allBios = allBios.concat(bios || []);
      if (!bios || bios.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // Count photos from senior_photos table
    const { count: photoCount, error: photoError } = await supabase
      .from('senior_photos')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null);

    if (photoError) {
      console.error("Error counting senior photos:", photoError);
    }

    return NextResponse.json({
      seniors: allBios,
      stats: {
        total: allBios.length,
        photos: photoCount || 0,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
