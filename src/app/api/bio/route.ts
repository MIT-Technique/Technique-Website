import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

// GET - Fetch senior bio by email
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({
        data: {
          name: '',
          major: '',
          minor: '',
          second_major: '',
          quote: '',
          achievements: '',
        }
      }, { status: 200 });
    }

    const supabase = createAdminClient();

    const { data: bio } = await supabase
      .from('senior_bios')
      .select('name, major, minor, second_major, quote, achievements')
      .eq('email', email)
      .single();

    return NextResponse.json({
      data: {
        name: bio?.name || '',
        major: bio?.major || '',
        minor: bio?.minor || '',
        second_major: bio?.second_major || '',
        quote: bio?.quote || '',
        achievements: bio?.achievements || '',
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bio:", error);
    return NextResponse.json(
      { error: "There was an error retrieving bio info" },
      { status: 500 }
    );
  }
}

// PUT - Create or update senior bio (upsert by email)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, name, major, minor, second_major, quote, achievements } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "MIT email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@mit.edu')) {
      return NextResponse.json(
        { error: "Must be a valid @mit.edu email address" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name || !major) {
      return NextResponse.json(
        { error: "Name and major are required" },
        { status: 400 }
      );
    }

    // Validate quote length
    if (quote && quote.length > 300) {
      return NextResponse.json(
        { error: "Quote must be 300 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Upsert senior bio by email
    const { error: bioError } = await supabase
      .from('senior_bios')
      .upsert({
        email: normalizedEmail,
        name,
        major: major || null,
        minor: minor || null,
        second_major: second_major || null,
        quote: quote || null,
        achievements: achievements || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (bioError) {
      console.error("Error saving senior bio:", bioError);
      return NextResponse.json(
        { error: "Failed to save bio data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating bio:", error);
    return NextResponse.json(
      { error: "There was an error saving bio data" },
      { status: 500 }
    );
  }
}
