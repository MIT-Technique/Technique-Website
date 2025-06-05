import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AxiosResponse } from "axios";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
export async function POST(request:NextRequest):Promise<NextResponse> {

  //Grabbing API Key from environment variables. See all the keys on the tnq drive if you don't have this
  const ANVIL_API_KEY:string = process.env.ANVIL_API_KEY;
  //DO NOT COMMIT THE API KEYS TO GITHUB!!!!!!!!!!!!!!

  const RECIPIENT_EMAIL:string = "tnq-exec@mit.edu";
  const FROM_EMAIL:string = "mittnq@gmail.com";

  try {
    const { anvilData, emailData } = await request.json();

    // Forward to Anvil's API
    const response:AxiosResponse<any, any> = await axios.post(
      `https://app.useanvil.com/api/v1/fill/87CCh3ozrdLPbTDlw3qT.pdf`,
      {
        //ID of pdf in Anvil
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

    //message containing invoice to send to tnq-exec
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
