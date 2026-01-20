import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/db";
import { getSession, getCryptr } from "../../../lib/lib";
import { studentSchema } from "../../../lib/studentSchema";
import z from "zod/v4";

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    // console.log(`session: ${JSON.stringify(session)}`);
    const { email } = session.userInfo;
    const body = await request.json();
    body.email = email;
    const cryp = getCryptr();
    body.firstName = cryp.encrypt(body.firstName);
    body.lastName = cryp.encrypt(body.lastName);
    const parsed = studentSchema.safeParse(body);
    // console.log("Parsed");
    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: z.treeifyError(parsed.error) }),
        {
          status: 400,
        }
      );
    }
    // console.log("Parsed");

    const { ...updateFields } = parsed.data;

    const collection = await connectToDatabase();
    // console.log("Successfully Connected");

    const result = await collection.updateOne(
      { email },
      { $set: updateFields }
    );
    // console.log(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "There was an error updating the bio" },
      { status: 500 }
    );
  }
}
