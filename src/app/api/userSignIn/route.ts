import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export async function POST(request:NextRequest, response:NextResponse):Promise<NextResponse> {
  const ANVIL_API_KEY:string = process.env.ANVIL_API_KEY;
  const RECIPIENT_EMAIL:string = "tnq-exec@mit.edu";
  const FROM_EMAIL:string = "mittnq@gmail.com";
  const email:FormDataEntryValue = (await request.formData()).get('email')
  console.log(`userEmail:${email}`)
return NextResponse.redirect(new URL('/signin', request.url));
}
