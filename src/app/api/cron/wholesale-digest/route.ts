import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pendingRegularEmails } from "@/lib/db/schema";
import nodemailer from "nodemailer";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const NORMAL_EMAILS = ["lior31197@gmail.com"];

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all pending regular products
    const pending = await db.select().from(pendingRegularEmails);

    if (pending.length === 0) {
      console.log("[wholesale-digest] No pending products to send");
      return NextResponse.json({
        success: true,
        message: "No pending products",
        count: 0,
      });
    }

    // 2. Split into new and updated
    const newProducts = pending.filter((p) => p.type === "new");
    const updatedProducts = pending.filter((p) => p.type === "updated");

    // 3. Build HTML
    const html = generateDigestHtml(newProducts, updatedProducts);

    // 4. Send email
    const gmailAddress =
      process.env.GMAIL_APP_USER || process.env.GMAIL_ADDRESS;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailAddress || !gmailPassword) {
      console.warn(
        "[wholesale-digest] Missing email configuration — skipping"
      );
      return NextResponse.json(
        { success: false, error: "Missing email configuration" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailAddress, pass: gmailPassword },
    });

    const totalCount = pending.length;
    await transporter.sendMail({
      from: gmailAddress,
      to: NORMAL_EMAILS.join(", "),
      subject: `📦 סיכום יומי — ${totalCount} מוצרים רגילים מהאתר הסיטונאי`,
      html,
    });

    console.log(
      `[wholesale-digest] Sent daily digest with ${totalCount} products`
    );

    // 5. Delete all pending rows
    await db.delete(pendingRegularEmails);

    return NextResponse.json({
      success: true,
      message: "Daily digest sent",
      count: totalCount,
      newCount: newProducts.length,
      updatedCount: updatedProducts.length,
    });
  } catch (error: any) {
    console.error("[wholesale-digest] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ─── HTML Generator ───

interface PendingProduct {
  productName: string;
  brand: string | null;
  price: string | null;
  oldPrice: string | null;
  stock: string | null;
  dtCreated: string | null;
}

function generateDigestHtml(
  newItems: PendingProduct[],
  updatedItems: PendingProduct[]
): string {
  const now = new Date().toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
  });
  const total = newItems.length + updatedItems.length;

  let html = `<div dir="rtl" style="font-family: Arial, sans-serif;">
    <h2>📦 סיכום יומי — ${total} מוצרים רגילים מהאתר הסיטונאי</h2>
    <p style="color: #666; font-size: 13px;">נוצר ב-${now}</p>`;

  if (newItems.length > 0) {
    html += `<h3>✨ מוצרים חדשים (${newItems.length})</h3>`;
    html += `
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>מותג</th>
            <th>שם המוצר</th>
            <th>מחיר</th>
            <th>מלאי</th>
            <th>תאריך העלאה</th>
          </tr>
        </thead>
        <tbody>
          ${newItems
            .map(
              (p) => `
            <tr>
              <td>${p.brand || ""}</td>
              <td>${p.productName}</td>
              <td>₪${p.price || "N/A"}</td>
              <td>${p.stock || ""}</td>
              <td>${p.dtCreated || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  if (updatedItems.length > 0) {
    html += `<h3>🔄 עדכוני מחיר / חזר למלאי (${updatedItems.length})</h3>`;
    html += `
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>מותג</th>
            <th>שם המוצר</th>
            <th>מחיר עדכני</th>
            <th>מחיר קודם</th>
            <th>מלאי</th>
            <th>תאריך העלאה</th>
          </tr>
        </thead>
        <tbody>
          ${updatedItems
            .map(
              (p) => `
            <tr>
              <td>${p.brand || ""}</td>
              <td>${p.productName}</td>
              <td style="color: red; font-weight: bold;">₪${p.price || "N/A"}</td>
              <td style="text-decoration: line-through; color: #888;">${p.oldPrice ? `₪${p.oldPrice}` : "לא ידוע"}</td>
              <td>${p.stock || ""}</td>
              <td>${p.dtCreated || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  html += `
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="text-align: center; color: #999; font-size: 11px;">
      Wholesale Daily Digest &bull; Vercel Cron &bull; 20:00
    </p>
  </div>`;

  return html;
}
