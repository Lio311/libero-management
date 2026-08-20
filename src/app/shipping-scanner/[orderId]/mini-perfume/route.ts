import { getOrderById } from "@/app/actions/scanner-actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const resolvedParams = await params;
  const searchParams = request.nextUrl.searchParams;
  const store = (searchParams.get("store") || "libero") as "libero" | "velour" | "labura";
  
  const order = await getOrderById(Number(resolvedParams.orderId), store);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  // Filter items that have "מיני בושם" in their name
  const miniPerfumes = order.lineItems.filter((item: any) => 
    (item.name || "").includes("מיני בושם")
  );

  if (miniPerfumes.length === 0) {
    return new NextResponse(
      `<div style="padding: 2rem; text-align: center; font-size: 1.25rem;" dir="rtl">לא נמצאו מוצרי מיני בושם בהזמנה זו.</div>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Create an array of labels based on quantities
  const labelsToPrint = [];
  for (const item of miniPerfumes) {
    const qty = item.quantity || 1;
    
    // Extract text up to the first English letter
    // This ensures things like "א.ד.פ." are included, stopping before "Memo Paris..."
    const hebrewMatch = (item.name || "").match(/^[^a-zA-Z]+/);
    let hebrewName = hebrewMatch ? hebrewMatch[0].trim() : item.name;

    // Remove trailing hyphens or pipes if any
    hebrewName = hebrewName.replace(/[\-\|]$/, "").trim();

    let englishName = "";
    if (hebrewMatch) {
      let rest = item.name.substring(hebrewMatch[0].length);
      // Remove known suffixes
      rest = rest.replace(/\b\d+\s*ml\b/gi, "");
      rest = rest.replace(/מיני בושם/g, "");
      rest = rest.replace(/\(travel\)/gi, "");
      // Remove any remaining Hebrew characters
      rest = rest.replace(/[\u0590-\u05FF]+/g, "");
      // Clean up punctuation and spaces
      englishName = rest.replace(/^[\-\|\s\,]+/, "").replace(/[\-\|\s\,]+$/, "").trim();
    }

    for (let i = 0; i < qty; i++) {
      labelsToPrint.push({
        id: `${item.id}-${i}`,
        hebrew: hebrewName,
        english: englishName,
      });
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>מדבקות מיני בושם - הזמנה ${order.id}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .label-page {
            width: 50mm;
            height: 25mm;
            text-align: center;
            padding: 2mm;
            box-sizing: border-box;
            page-break-after: always;
            overflow: hidden;
            display: table;
          }
          .label-page:last-child {
            page-break-after: avoid;
          }
          .label-text-container {
            display: table-cell;
            vertical-align: middle;
            width: 100%;
          }
          .hebrew-text {
            font-size: 11pt;
            font-weight: bold;
            line-height: 1.2;
            word-wrap: break-word;
            direction: rtl;
          }
          .english-text {
            font-size: 10pt;
            font-weight: bold;
            line-height: 1.2;
            word-wrap: break-word;
            direction: ltr;
            margin-top: 3px;
          }
          @media screen {
            body {
              background: #f0f0f0;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
              gap: 20px;
            }
            .label-page {
              background: #fff;
              box-shadow: 0 0 5px rgba(0,0,0,0.2);
              border: 1px dashed #ccc;
            }
            .print-btn-container {
              margin-bottom: 20px;
            }
            .print-btn {
              padding: 10px 20px;
              background: #000;
              color: #fff;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            }
          }
          @media print {
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
            .print-btn-container {
              display: none;
            }
            .label-page {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-container">
          <button id="printBtn" class="print-btn">
            הדפס מדבקות (${labelsToPrint.length})
          </button>
        </div>

        ${labelsToPrint.map(label => `
          <div class="label-page">
            <div class="label-text-container">
              <div class="hebrew-text">${label.hebrew}</div>
              ${label.english ? `<div class="english-text">${label.english}</div>` : ''}
            </div>
          </div>
        `).join('')}

        <script>
          // Attach print event listener
          document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
          });
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
