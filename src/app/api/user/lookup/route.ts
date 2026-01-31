import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Look up user data by email (for form auto-population)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email || !email.endsWith("@mit.edu")) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("first_name, last_name, major, second_major")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        data: {
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          major: user.major || "",
          secondMajor: user.second_major || "",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error looking up user:", error);
    return NextResponse.json({ data: null }, { status: 200 });
  }
}
