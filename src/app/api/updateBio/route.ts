import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AxiosResponse } from "axios";
import sgMail from "@sendgrid/mail";
import { PDFDocument, rgb, drawTextField } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function PUT(request: NextRequest): Promise<NextResponse> {


  try {
    
    console.log(request.body)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
