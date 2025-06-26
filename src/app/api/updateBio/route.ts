import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AxiosResponse } from "axios";
import sgMail from "@sendgrid/mail";
import { PDFDocument, rgb, drawTextField } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { connectToDatabase } from "../../../lib/db";
import { getSession } from "../../../lib/lib";
import clientPromise from "mongodb";
import { studentSchema } from "../../../lib/studentSchema";
import z from "zod/v4";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    const { email } = session.userInfo;
    const body = await request.json();
    body.email = email;
    const parsed = studentSchema.safeParse(body);

    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: z.treeifyError(parsed.error) }),
        {
          status: 400,
        }
      );
    }

    const { ...updateFields } = parsed.data;

    const collection = await connectToDatabase();

    const result = await collection.updateOne(
      { email },
      { $set: updateFields }
    );
    console.log(request.body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
