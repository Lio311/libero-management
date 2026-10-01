import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderScanProgress } from "@/lib/db/schema";
import nodemailer from "nodemailer";

export async function GET(request: Request) {
  const gmailAddress = process.env.GMAIL_APP_USER || process.env.GMAIL_ADDRESS;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailAddress || !gmailPassword) {
    return NextResponse.json({ error: "Missing GMAIL_ADDRESS or GMAIL_APP_PASSWORD env vars" }, { status: 500 });
  }

  const storeNames: Record<string, string> = {
    libero: "ליברו",
    velour: "וולור",
    labura: "לה בורה",
  };

  try {
    // Fetch all shortages from DB
    const allProgress = await db.select().from(orderScanProgress);
    const shortageRecords = allProgress.filter(record => {
      const items = record.items as any[];
      return items && items.some((item: any) => item.isMissing === true);
    });

    if (shortageRecords.length === 0) {
      return NextResponse.json({ success: true, message: "אין חוסרים במערכת - לא נשלח מייל" });
    }

    // Build email HTML
    const rows = shortageRecords.map(record => {
      const items = record.items as any[];
      const missing = items.filter((i: any) => i.isMissing === true);
      const storeName = storeNames[record.store] || record.store;
      const itemsList = missing.map((i: any) => 
        `<div style="margin-bottom: 4px;">• ${i.name || 'לא ידוע'} (מק"ט: ${i.sku || '-'}) — הוזמן: ${i.expected || 0}, נסרק: ${i.scanned || 0}</div>`
      ).join("");
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; text-align: right; font-weight: bold;">#${record.orderId}</td>
          <td style="padding: 12px; text-align: right;">${storeName}</td>
          <td style="padding: 12px; text-align: right; font-size: 13px;">${itemsList}</td>
        </tr>`;
    }).join("");

    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px; max-width: 700px; margin: 0 auto;">
        <h2 style="color: #e63946;">📋 סיכום חוסרים במערכת</h2>
        <p>שלום,</p>
        <p>זהו מייל בדיקה עם כל החוסרים הקיימים במערכת.</p>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-right: 4px solid #e63946;">
          <strong>סה"כ הזמנות עם חוסרים:</strong> ${shortageRecords.length}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
              <th style="padding: 12px; text-align: right;">הזמנה</th>
              <th style="padding: 12px; text-align: right;">חנות</th>
              <th style="padding: 12px; text-align: right;">מוצרים חסרים</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        
        <p style="margin-top: 20px;"><small>הודעה זו נשלחה כמייל בדיקה ממערכת הסורק</small></p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailAddress, pass: gmailPassword },
    });

    await transporter.sendMail({
      from: gmailAddress,
      to: "lior31197@gmail.com",
      subject: `📋 [בדיקה] סיכום חוסרים - ${shortageRecords.length} הזמנות עם חוסרים`,
      html: htmlBody,
    });

    return NextResponse.json({ 
      success: true, 
      message: `מייל בדיקה נשלח בהצלחה עם ${shortageRecords.length} הזמנות`,
      shortageCount: shortageRecords.length 
    });
  } catch (error: any) {
    console.error("Test shortage email error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
