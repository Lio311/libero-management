import { NextResponse } from "next/server";
import { put, head } from "@vercel/blob";
import nodemailer from "nodemailer";

// ─── Config ───
const COLLECTION_URL =
  "https://mist.co.il/collections/back-in-stock/products.json?limit=250";
const EMAIL_TO = "lior31197@gmail.com";
const BLOB_KEY = "mist-monitor/known-ids.json";

// ─── Types ───
interface MistVariant {
  price: string;
}
interface MistImage {
  src: string;
}
interface MistProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  published_at: string;
  variants: MistVariant[];
  images: MistImage[];
}

// ─── State: stored in Vercel Blob ───

async function loadKnownIds(): Promise<Set<number>> {
  try {
    const blob = await head(BLOB_KEY);
    if (blob) {
      const res = await fetch(blob.url);
      const ids: number[] = await res.json();
      return new Set(ids);
    }
  } catch {
    // First run or blob doesn't exist
  }
  return new Set();
}

async function saveKnownIds(ids: Set<number>) {
  await put(BLOB_KEY, JSON.stringify([...ids]), {
    access: "public",
    addRandomSuffix: false,
  });
}

// ─── Email ───

function formatPrice(price: string): string {
  try {
    return `₪${Number(price).toLocaleString("he-IL")}`;
  } catch {
    return price || "N/A";
  }
}

function buildEmailHtml(products: MistProduct[]): string {
  const count = products.length;
  const cards = products
    .map((p) => {
      const imgSrc = p.images?.[0]?.src || "";
      const price = formatPrice(p.variants?.[0]?.price || "");
      const url = `https://mist.co.il/products/${p.handle}`;
      const imgHtml = imgSrc
        ? `<img src="${imgSrc}" width="120" style="border-radius:8px;" />`
        : "";

      return `
      <div style="display:flex; gap:16px; padding:16px; margin:12px 0;
                  background:#f8f9fa; border-radius:12px; border:1px solid #e9ecef;
                  direction:rtl; text-align:right;">
        <div style="flex-shrink:0;">${imgHtml}</div>
        <div style="flex:1;">
          <h3 style="margin:0 0 6px 0; color:#1a1a2e; font-size:16px;">${p.title}</h3>
          <p style="margin:0 0 4px 0; color:#666; font-size:13px;">${p.vendor} &bull; ${p.product_type}</p>
          <p style="margin:0 0 10px 0; font-size:20px; font-weight:bold; color:#c6b279;">${price}</p>
          <a href="${url}" style="display:inline-block; padding:8px 20px;
             background:#1a1a2e; color:white; text-decoration:none;
             border-radius:6px; font-size:13px;">לצפייה במוצר →</a>
        </div>
      </div>`;
    })
    .join("");

  const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });

  return `
  <html dir="rtl">
  <body style="font-family: -apple-system, Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
    <div style="text-align:center; padding:20px 0;">
      <h1 style="color:#1a1a2e; margin:0;">🚨 MIST — מוצר חדש במלאי!</h1>
      <p style="color:#666; font-size:14px;">${count} מוצר${count > 1 ? "ים" : ""} חדש${count > 1 ? "ים" : ""} &bull; ${now}</p>
    </div>
    ${cards}
    <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
    <p style="text-align:center; color:#999; font-size:11px;">
      MIST Monitor &bull; Vercel Cron &bull; בדיקה כל דקה
    </p>
  </body>
  </html>`;
}

async function sendEmail(products: MistProduct[]) {
  const gmailAddress = process.env.GMAIL_ADDRESS;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailAddress || !gmailPassword) {
    throw new Error("Missing GMAIL_ADDRESS or GMAIL_APP_PASSWORD env vars");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailAddress, pass: gmailPassword },
  });

  const titles = products
    .slice(0, 3)
    .map((p) => p.title.substring(0, 30))
    .join(", ");
  const suffix = products.length > 3 ? ` (+${products.length - 3} עוד)` : "";

  await transporter.sendMail({
    from: gmailAddress,
    to: EMAIL_TO,
    subject: `🚨 MIST — ${products.length} מוצר חדש: ${titles}${suffix}`,
    html: buildEmailHtml(products),
  });
}

// ─── Route Handler ───
export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch current products from MIST
    const res = await fetch(COLLECTION_URL, {
      headers: { "User-Agent": "MistMonitor/1.0" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `MIST API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const products: MistProduct[] = data.products || [];
    const currentIds = new Set(products.map((p) => p.id));

    // 2. Load previously known IDs from Vercel Blob
    const knownIds = await loadKnownIds();
    const isFirstRun = knownIds.size === 0;

    if (isFirstRun) {
      // First run — save current state, don't send email
      await saveKnownIds(currentIds);
      console.log(
        `[mist-monitor] First run — saved ${currentIds.size} product IDs`
      );
      return NextResponse.json({
        status: "first_run",
        saved: currentIds.size,
      });
    }

    // 3. Find truly new products (IDs we've never seen)
    const newIds = [...currentIds].filter((id) => !knownIds.has(id));
    const newProducts = products.filter((p) => newIds.includes(p.id));

    if (newProducts.length > 0) {
      // 4. Send email ONLY for new products
      await sendEmail(newProducts);

      // 5. Update known IDs (merge old + new)
      const mergedIds = new Set([...knownIds, ...currentIds]);
      await saveKnownIds(mergedIds);

      console.log(
        `[mist-monitor] Sent email for ${newProducts.length} new product(s)`
      );
      return NextResponse.json({
        status: "email_sent",
        count: newProducts.length,
        products: newProducts.map((p) => p.title),
      });
    }

    // No new products — still update known IDs (in case products were removed and re-added)
    await saveKnownIds(new Set([...knownIds, ...currentIds]));

    console.log(`[mist-monitor] No new products (${products.length} total)`);
    return NextResponse.json({
      status: "no_new_products",
      total: products.length,
    });
  } catch (error) {
    console.error("[mist-monitor] Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
