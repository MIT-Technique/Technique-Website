import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/db";
import { getSession } from "../../../lib/auth/session";
import { getCryptr } from "../../../lib/lib";
import { studentSchema } from "../../../lib/studentSchema";
import z from "zod/v4";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // console.log("Before Session grab");
    const session = await getSession();
    // console.log("After Session grab");
    if (!session?.userInfo?.email) {
      // console.log(
      //   `Session found before unauth: ${JSON.stringify(session, null, 2)}`
      // );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email } = session?.userInfo;
    const collection = await connectToDatabase();
    console.log("After database connection");
    console.log(`Email found: ${email}`);
    console.log(`Session found: ${JSON.stringify(session, null, 2)}`);

    const user = await collection.findOne({ email });
    // console.log("Found user");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const cryp = getCryptr();
    user.firstName = cryp.decrypt(user.firstName);
    user.lastName = cryp.decrypt(user.lastName);
    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "There was an error retrieving user info" },
      { status: 500 }
    );
  }
}
