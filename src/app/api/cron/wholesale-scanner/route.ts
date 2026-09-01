import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scannedWholesaleProducts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { put } from "@vercel/blob";

export const maxDuration = 300; // 5 minutes max duration for cron
export const dynamic = "force-dynamic";

const HOT_KEYWORDS = [
  // Blonde Amber
  "בלונד אמבר",
  "blonde amber",
  
  // Ex Nihilo
  "אקס נילו",
  "ex nihilo",
  
  // Ormonde Jayne
  "הורמון גאבה",
  "אורמונד ג'יין",
  "ormonde jayne",
  
  // Amouage & Outlands
  "אמואג׳",
  "amouage",
  "outlands",
  
  // By Kilian
  "ביי קיליאן",
  "קיליאן",
  "by kilian",
  "kilian",
  
  // Essential Parfums (Bois Imperial)
  "אסנשייל פרפיומס",
  "אסנשייל פרפיומס בויס",
  "בויס אימפריאל",
  "essential parfums",
  "bois imperial",
  
  // Spirit of Dubai
  "ספיריט אוף דובאי",
  "spirit of dubai",
  
  // Memo Cap Camarat
  "ממו קאפ קמראט",
  "memo cap camarat",
  
  // Roja
  "רוז'ה",
  "רוז׳ה",
  "roja",
  
  // Parfums de Marly - Valaya
  "פרפום דה מארלי",
  "פרפיום דה מארלי",
  "parfums de marly",
  "valya",
  "valaya",
  "ואליה",
  "וואליה",
  
  // Jeroboam - Gozo
  "גוזו",
  "gozo",
  "jeroboam",
  "ג'רובום",
  // Maison Crivelli - Hibiscus Mahajad
  "מייסון קריבלי",
  "maison crivelli",
  "היביסקוס",
  "היביסקוס מהג'אד",
  "hibiscus",
  "hibiscus mahajád",
  "hibiscus mahajad",
  
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
    (kw) => brand.includes(kw.toLowerCase()) || name.includes(kw.toLowerCase())
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

    // 3. Find which IDs and names have already been scanned
    const alreadyScanned = await db
      .select({ 
        id: scannedWholesaleProducts.id, 
        productName: scannedWholesaleProducts.productName,
        price: scannedWholesaleProducts.price
      })
      .from(scannedWholesaleProducts);

    const scannedIdsMap = new Map(alreadyScanned.map((s) => [s.id, s]));
    const scannedNamesMap = new Map(alreadyScanned.map((s) => [(s.productName || "").trim().toLowerCase(), s]));

    const trulyNewProducts: any[] = [];
    const updatedProducts: any[] = [];
    
    const productsToInsert: any[] = [];
    const productsToUpdate: any[] = [];

    for (const p of allProducts) {
      const existingById = scannedIdsMap.get(p.id);
      const existingByName = scannedNamesMap.get((p.product_name || "").trim().toLowerCase());

      if (existingById) {
        // ID already exists. Check if the price has changed.
        const oldPriceStr = existingById.price ? String(existingById.price) : null;
        const newPriceStr = p.price ? String(p.price) : null;

        if (oldPriceStr !== newPriceStr) {
          updatedProducts.push({ ...p, oldPrice: oldPriceStr });
          productsToUpdate.push({ id: p.id, newPrice: newPriceStr, img: p.img });
        }
      } else {
        // New ID, needs to be inserted so we don't scan it as new again
        productsToInsert.push(p);

        if (existingByName) {
          // Name already exists, so it's a re-upload or price update
          updatedProducts.push({ ...p, oldPrice: existingByName.price });
        } else {
          // Truly new product
          trulyNewProducts.push(p);
        }
      }
    }

    if (trulyNewProducts.length === 0 && updatedProducts.length === 0) {
      return NextResponse.json({ success: true, message: "No new products or updates", count: 0 });
    }

    // Sort descending by dt_created
    const sortByDate = (a: any, b: any) => {
      const dateA = a.dt_created ? new Date(a.dt_created).getTime() : 0;
      const dateB = b.dt_created ? new Date(b.dt_created).getTime() : 0;
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    };

    trulyNewProducts.sort(sortByDate);
    updatedProducts.sort(sortByDate);

    // 4. Send emails
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

      const hotNew = trulyNewProducts.filter(isHotProduct);
      const hotUpdated = updatedProducts.filter(isHotProduct);

      const regularNew = trulyNewProducts.filter((p: any) => !isHotProduct(p));
      const regularUpdated = updatedProducts.filter((p: any) => !isHotProduct(p));

      const generateHtml = (newItems: any[], updatedItems: any[], title: string) => {
        let html = `<div dir="rtl" style="font-family: Arial, sans-serif;"><h2>${title}</h2>`;

        if (newItems.length > 0) {
          html += `<h3>✨ מוצרים חדשים</h3>`;
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
                ${newItems.map(p => `
                  <tr>
                    <td>${p.brand}</td>
                    <td>${p.product_name}</td>
                    <td>₪${p.price}</td>
                    <td>${p.stock}</td>
                    <td>${p.dt_created}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
        }

        if (updatedItems.length > 0) {
          html += `<h3>🔄 עדכוני מחיר / חזר למלאי</h3>`;
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
                ${updatedItems.map(p => `
                  <tr>
                    <td>${p.brand}</td>
                    <td>${p.product_name}</td>
                    <td style="color: red; font-weight: bold;">₪${p.price}</td>
                    <td style="text-decoration: line-through; color: #888;">${p.oldPrice ? `₪${p.oldPrice}` : 'לא ידוע'}</td>
                    <td>${p.stock}</td>
                    <td>${p.dt_created}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `;
        }

        html += `</div>`;
        return html;
      };

      // Send Hot Products Email
      if (hotNew.length > 0 || hotUpdated.length > 0) {
        try {
          const totalHot = hotNew.length + hotUpdated.length;
          await transporter.sendMail({
            from: gmailAddress,
            to: HOT_EMAILS.join(", "),
            subject: `🔥 עדכון מוצרים חמים מהאתר הסיטונאי (${totalHot})`,
            html: generateHtml(hotNew, hotUpdated, `עדכון לגבי ${totalHot} מוצרים חמים!`),
          });
          emailsSent++;
        } catch (err) {
          console.error("Failed to send hot products email:", err);
        }
      }

      // Send Regular Products Email
      if (regularNew.length > 0 || regularUpdated.length > 0) {
        try {
          const totalRegular = regularNew.length + regularUpdated.length;
          await transporter.sendMail({
            from: gmailAddress,
            to: NORMAL_EMAILS.join(", "),
            subject: `📦 עדכון מוצרים רגילים מהאתר הסיטונאי (${totalRegular})`,
            html: generateHtml(regularNew, regularUpdated, `עדכון לגבי ${totalRegular} מוצרים`),
          });
          emailsSent++;
        } catch (err) {
          console.error("Failed to send regular products email:", err);
        }
      }
    } // close the else block for email configuration check


    // 5. Update database
    if (productsToInsert.length > 0) {
      const insertData = productsToInsert.map((p: any) => ({
        id: p.id,
        productName: p.product_name || "Unknown",
        brand: p.brand || "",
        img: p.img || "",
        price: p.price ? String(p.price) : null,
        stock: p.stock ? String(p.stock) : null,
      }));
      await db.insert(scannedWholesaleProducts).values(insertData);
    }

    if (productsToUpdate.length > 0) {
      for (const u of productsToUpdate) {
        const updateData: any = { price: u.newPrice };
        if (u.img && u.img.startsWith('http')) {
          updateData.img = u.img;
        }
        await db.update(scannedWholesaleProducts)
          .set(updateData)
          .where(eq(scannedWholesaleProducts.id, u.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Scanned successfully",
      newProductsCount: trulyNewProducts.length,
      updatedProductsCount: updatedProducts.length,
      emailsSent,
    });
  } catch (error: any) {
    console.error("Wholesale scanner error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
