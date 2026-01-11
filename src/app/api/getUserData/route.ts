import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/db";
import { getSession } from "../../../lib/lib";
import { studentSchema } from "../../../lib/studentSchema";
import z from "zod/v4";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session?.userInfo?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email } = session?.userInfo;
    const collection = await connectToDatabase();

    const user = await collection.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "There was an error retrieving user info" },
      { status: 500 }
    );
  }
}
