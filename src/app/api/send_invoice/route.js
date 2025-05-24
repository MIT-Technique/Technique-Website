import { NextResponse } from "next/server";
import axios from "axios";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export async function POST(request) {
  const ANVIL_API_KEY = process.env.ANVIL_API_KEY;
  const RECIPIENT_EMAIL = "tnq-exec@mit.edu";
  const FROM_EMAIL = "mittnq@gmail.com";

  try {
    const { anvilData, emailData } = await request.json();

    // Forward to Anvil's API
    const response = await axios.post(
      `https://app.useanvil.com/api/v1/fill/87CCh3ozrdLPbTDlw3qT.pdf`,
      {
        templateId: "87CCh3ozrdLPbTDlw3qT",
        ...anvilData,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(ANVIL_API_KEY + ":").toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const pdfBase64 = response.data.toString("base64");
    const msg = {
      to: RECIPIENT_EMAIL,
      from: FROM_EMAIL,
      subject: `New Invoice for Photography Job Technique did for ${emailData.orgName} that happened on ${emailData.eventDate}`,
      text: "Please find the invoice attached.",
      html: `<p>Cost Object: ${emailData.costObject}</p>`,
      attachments: [
        {
          content: pdfBase64,
          filename: "invoice.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
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
