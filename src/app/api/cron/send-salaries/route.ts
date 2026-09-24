import { NextResponse } from "next/server";
import { generateSalariesExcel } from "@/lib/salaries";
import nodemailer from "nodemailer";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the previous month for the salaries
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // Determine base URL
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = host 
      ? `${protocol}://${host}` 
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    console.log(`Generating salaries excel for ${month} using baseUrl: ${baseUrl}`);
    const excelBuffer = await generateSalariesExcel(month, baseUrl);

    const gmailAddress = process.env.GMAIL_APP_USER || process.env.GMAIL_ADDRESS;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailAddress || !gmailPassword) {
      console.error("Missing Gmail credentials in environment variables");
      return NextResponse.json({ error: "Missing email credentials" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailAddress, pass: gmailPassword },
    });

    const mailOptions = {
      from: gmailAddress,
      to: "lior31197@gmail.com",
      subject: `דו"ח משכורות משפיענים לחודש ${month}`,
      text: `מצורף קובץ אקסל עם משכורות המשפיענים לחודש ${month}.`,
      attachments: [
        {
          filename: `salaries-${month}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log("Salaries email sent successfully.");

    return NextResponse.json({ success: true, month });
  } catch (error: any) {
    console.error("Cron send-salaries error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
