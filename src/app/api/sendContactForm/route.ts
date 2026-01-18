import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const RECIPIENT_EMAIL: string = "tnq-exec@mit.edu";
  const FROM_EMAIL: string = "mittnq@gmail.com";

  try {
    const { formType, data } = await request.json();

    let subject: string;
    let htmlContent: string;

    if (formType === "parent") {
      subject = `Parent Inquiry: ${data.category}`;
      htmlContent = `
        <h2>New Parent Inquiry</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.studentName ? `<p><strong>Student Name:</strong> ${data.studentName}</p>` : ""}
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, "<br>")}</p>
      `;
    } else if (formType === "alumni") {
      subject = `Alumni Inquiry: ${data.category}`;
      htmlContent = `
        <h2>New Alumni Inquiry</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.graduationYear ? `<p><strong>Graduation Year:</strong> ${data.graduationYear}</p>` : ""}
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, "<br>")}</p>
      `;
    } else {
      return NextResponse.json(
        { error: "Invalid form type" },
        { status: 400 }
      );
    }

    const msg = {
      to: RECIPIENT_EMAIL,
      from: FROM_EMAIL,
      replyTo: data.email,
      subject: subject,
      html: htmlContent,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
