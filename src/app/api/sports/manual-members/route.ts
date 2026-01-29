import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { parseBulkNames } from "../../../../lib/utils/nameParser";

// GET - Get all manual members for a sports team
export async function GET(request: NextRequest) {
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

    // Optional team filter
    const teamFilter = request.nextUrl.searchParams.get('team');

    let query = supabase
      .from('sports_manual_members')
      .select('id, first_name, last_name, team, added_at')
      .eq('sports_id', sports.id)
      .order('last_name')
      .order('first_name');

    if (teamFilter && ['mens', 'womens'].includes(teamFilter)) {
      query = query.eq('team', teamFilter);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error("Get members error:", error);
      return NextResponse.json({ error: "Failed to get members" }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json({ error: "Failed to get members" }, { status: 500 });
  }
}

// POST - Add member(s) - single or bulk
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'sports') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, bulkText, team } = body;

    // Validate team value
    if (team && !['mens', 'womens'].includes(team)) {
      return NextResponse.json({ error: "Team must be 'mens' or 'womens'" }, { status: 400 });
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

    // BULK IMPORT MODE
    if (bulkText) {
      const parseResult = parseBulkNames(bulkText);

      if (parseResult.errors.length > 0 && parseResult.success.length === 0) {
        return NextResponse.json(
          { error: "All names failed to parse", parseErrors: parseResult.errors },
          { status: 400 }
        );
      }

      // Check for duplicates
      const { data: existingMembers } = await supabase
        .from('sports_manual_members')
        .select('first_name, last_name')
        .eq('sports_id', sports.id)
        .eq('team', team || null);

      const duplicates: string[] = [];
      const toInsert = parseResult.success.filter((parsed) => {
        const isDuplicate = existingMembers?.some(
          (existing) =>
            existing.first_name.toLowerCase() === parsed.firstName.toLowerCase() &&
            existing.last_name.toLowerCase() === parsed.lastName.toLowerCase()
        );
        if (isDuplicate) {
          duplicates.push(`${parsed.firstName} ${parsed.lastName}`.trim());
        }
        return !isDuplicate;
      });

      if (toInsert.length === 0) {
        return NextResponse.json(
          { error: "No new members to add (all duplicates or parse errors)", duplicates, parseErrors: parseResult.errors },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('sports_manual_members')
        .insert(
          toInsert.map((parsed) => ({
            sports_id: sports.id,
            first_name: parsed.firstName,
            last_name: parsed.lastName,
            name: parsed.firstName
              ? `${parsed.lastName}, ${parsed.firstName}`
              : parsed.lastName,
            team: team || null,
          }))
        )
        .select();

      if (error) {
        console.error("Bulk insert error:", error);
        return NextResponse.json({ error: "Failed to add members" }, { status: 500 });
      }

      return NextResponse.json({
        members: data,
        count: data.length,
        parseErrors: parseResult.errors,
        duplicates,
      });
    }

    // SINGLE ADD MODE
    if (firstName === undefined || lastName === undefined) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    const trimmedFirst = String(firstName).trim();
    const trimmedLast = String(lastName).trim();

    if (!trimmedLast || trimmedLast.length === 0) {
      return NextResponse.json({ error: "Last name is required" }, { status: 400 });
    }

    if (trimmedFirst.length > 100 || trimmedLast.length > 100) {
      return NextResponse.json({ error: "Name fields must be 100 characters or less" }, { status: 400 });
    }

    // Duplicate check
    const { data: duplicate } = await supabase
      .from('sports_manual_members')
      .select('id')
      .eq('sports_id', sports.id)
      .eq('first_name', trimmedFirst)
      .eq('last_name', trimmedLast)
      .eq('team', team || null)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json({ error: "This member already exists" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sports_manual_members')
      .insert({
        sports_id: sports.id,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        name: trimmedFirst
          ? `${trimmedLast}, ${trimmedFirst}`
          : trimmedLast,
        team: team || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Add member error:", error);
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// DELETE - Remove a member
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'sports') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = request.nextUrl.searchParams.get('id');

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
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

    // Verify member belongs to this sports team
    const { data: member } = await supabase
      .from('sports_manual_members')
      .select('id, sports_id')
      .eq('id', memberId)
      .single();

    if (!member || member.sports_id !== sports.id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from('sports_manual_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error("Delete member error:", error);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
