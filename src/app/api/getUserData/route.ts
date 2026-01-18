import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/lib";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Before Session grab");
    const session = await getSession();
    console.log("After Session grab");
    if (!session?.userInfo?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email } = session?.userInfo;

    // Create Supabase client with service role (bypasses RLS)
    const supabase = await createServiceSupabaseClient();
    console.log("After Supabase connection");
    console.log(`Email found: ${email}`);

    const { data: user, error } = await supabase
      .from('bios')
      .select('*')
      .eq('email', email)
      .single();

    console.log("Query completed");

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - not an error, just means user doesn't exist yet
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user");
    // Note: Supabase encrypts at rest, so no need for Cryptr decryption
    // Map snake_case to camelCase for frontend compatibility
    const userData = {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      major: user.major,
      quote: user.quote,
    };

    return NextResponse.json({ data: userData }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "There was an error retrieving user info" },
      { status: 500 }
    );
  }
}
