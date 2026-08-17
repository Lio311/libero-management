import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scannedWholesaleProducts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import nodemailer from "nodemailer";

export const maxDuration = 300; // 5 minutes max duration for cron
export const dynamic = "force-dynamic";

const HOT_KEYWORDS = [
  "בלונד אמבר",
  "אקס נילו",
  "הורמון גאבה",
  "אמואג׳",
  "ביי קיליאן",
  "אסנשייל פרפיומס בויס",
  "ספיריט אוף דובאי",
];

const NORMAL_EMAILS = ["lior31197@gmail.com"];
const HOT_EMAILS = [
  "lior31197@gmail.com",
  "suppliers@libero-il.co.il",
  "daniel@libero-il.co.il",
  "liberoperfume@gmail.com",
];

function isHotProduct(product: any) {
  const brand = (product.brand || "").toLowerCase();
  const name = (product.product_name || "").toLowerCase();
  return HOT_KEYWORDS.some(
    (kw) => brand.includes(kw) || name.includes(kw)
  );
}

export async function GET(request: Request) {
  try {
    // 0. Ensure credentials exist
    const lindoEmail = process.env.LINDO_EMAIL;
    const lindoPassword = process.env.LINDO_PASSWORD;

    if (!lindoEmail || !lindoPassword) {
      return NextResponse.json({ success: false, error: "Missing Lindo credentials in environment variables" }, { status: 500 });
    }

    // 1. Authenticate with Lindo portal
    const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `email_address=${encodeURIComponent(lindoEmail)}&password=${encodeURIComponent(lindoPassword)}&remember_me=yes`,
      redirect: "manual",
    });

    const cookies = loginRes.headers.getSetCookie();
    let cookieStr = "";
    if (cookies) {
      cookieStr = cookies.map((c) => c.split(";")[0]).join("; ");
    }

    // 2. Fetch Catalog
    const catalogRes = await fetch("https://elvis.lindo.co.il/apps/wholesale/ws-catalog.php", {
      method: "POST",
      headers: {
        "Cookie": cookieStr,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "comax_price_list_id=2",
    });

    const catalogData = await catalogRes.json();
    if (!catalogData || !catalogData.data) {
      return NextResponse.json({ success: false, error: "Invalid catalog format" }, { status: 500 });
    }

    const allProducts = catalogData.data;

    if (!allProducts || allProducts.length === 0) {
      return NextResponse.json({ success: true, message: "No products found" });
    }

    // 3. Find which IDs have already been scanned
    // We fetch all scanned IDs from the database to check against the entire catalog,
    // ensuring we don't miss products that were created long ago but only published today.
    const alreadyScanned = await db
      .select({ id: scannedWholesaleProducts.id })
      .from(scannedWholesaleProducts);

    const scannedIdsSet = new Set(alreadyScanned.map((s) => s.id));

    const newProducts = allProducts.filter((p: any) => !scannedIdsSet.has(p.id));

    if (newProducts.length === 0) {
      return NextResponse.json({ success: true, message: "No new products", count: 0 });
    }

    // Sort new products descending by dt_created so the newest show at the top of the email
    newProducts.sort((a: any, b: any) => {
      const dateA = a.dt_created ? new Date(a.dt_created).getTime() : 0;
      const dateB = b.dt_created ? new Date(b.dt_created).getTime() : 0;
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    });

    // 4. Send emails for new products
    const gmailAddress = process.env.GMAIL_APP_USER || process.env.GMAIL_ADDRESS;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    let emailsSent = 0;

    if (!gmailAddress || !gmailPassword) {
      console.warn("Missing email configuration - skipping email notifications, but will still update the database");
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailAddress, pass: gmailPassword },
      });



    const hotProducts = newProducts.filter(isHotProduct);
    const regularProducts = newProducts.filter((p: any) => !isHotProduct(p));

    // Helper to generate email HTML
    const generateHtml = (products: any[], title: string) => {
      return `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>${title}</h2>
          <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th>תמונה</th>
                <th>מותג</th>
                <th>שם המוצר</th>
                <th>מחיר</th>
                <th>מלאי</th>
                <th>תאריך העלאה</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td><img src="https://elvis.lindo.co.il/img/catalog/thumbnail/${p.img}" width="80" /></td>
                  <td>${p.brand}</td>
                  <td>${p.product_name}</td>
                  <td>₪${p.price}</td>
                  <td>${p.stock}</td>
                  <td>${p.dt_created}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    };

    // Send Hot Products Email
    if (hotProducts.length > 0 && gmailAddress) {
      try {
        await transporter.sendMail({
          from: gmailAddress,
          to: HOT_EMAILS.join(", "),
          subject: `🔥 מוצרים חמים חדשים עלו לאתר הסיטונאי (${hotProducts.length})`,
          html: generateHtml(hotProducts, `עלו ${hotProducts.length} מוצרים חמים חדשים!`),
        });
        emailsSent++;
      } catch (err) {
        console.error("Failed to send hot products email:", err);
      }
    }

    // Send Regular Products Email
    if (regularProducts.length > 0 && gmailAddress) {
      try {
        await transporter.sendMail({
          from: gmailAddress,
          to: NORMAL_EMAILS.join(", "),
          subject: `📦 מוצרים רגילים חדשים עלו לאתר הסיטונאי (${regularProducts.length})`,
          html: generateHtml(regularProducts, `עלו ${regularProducts.length} מוצרים חדשים`),
        });
        emailsSent++;
      } catch (err) {
        console.error("Failed to send regular products email:", err);
      }
    }
    } // close the else block for email configuration check

    // 5. Insert newly scanned IDs into database
    const insertData = newProducts.map((p: any) => ({
      id: p.id,
      productName: p.product_name || "Unknown",
      brand: p.brand || "",
      img: p.img || "",
      price: p.price ? String(p.price) : null,
      stock: p.stock ? String(p.stock) : null,
    }));

    await db.insert(scannedWholesaleProducts).values(insertData);

    return NextResponse.json({
      success: true,
      message: "Scanned successfully",
      newProductsCount: newProducts.length,
      emailsSent,
    });
  } catch (error: any) {
    console.error("Wholesale scanner error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
