import { getOrderById } from "@/app/actions/scanner-actions";
import { notFound } from "next/navigation";

export default async function MiniPerfumeLabelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ store?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const store = (resolvedSearchParams.store || "libero") as "libero" | "velour" | "labura";
  const order = await getOrderById(Number(resolvedParams.orderId), store);

  if (!order) {
    return notFound();
  }

  // Filter items that have "מיני בושם" in their name
  const miniPerfumes = order.lineItems.filter((item: any) => 
    (item.name || "").includes("מיני בושם")
  );

  if (miniPerfumes.length === 0) {
    return <div className="p-8 text-center text-xl">לא נמצאו מוצרי מיני בושם בהזמנה זו.</div>;
  }

  // Create an array of labels based on quantities
  const labelsToPrint = [];
  for (const item of miniPerfumes) {
    const qty = item.quantity || 1;
    
    // Extract only the leading Hebrew characters
    // Matches Hebrew letters and spaces at the start of the string
    const match = (item.name || "").match(/^[\u0590-\u05FF\s]+/);
    let hebrewName = match ? match[0].trim() : item.name;

    for (let i = 0; i < qty; i++) {
      labelsToPrint.push({
        id: `${item.id}-${i}`,
        text: hebrewName,
      });
    }
  }

  return (
    <html lang="he" dir="rtl">
      <head>
        <title>מדבקות מיני בושם - הזמנה {order.id}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
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
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2mm;
            box-sizing: border-box;
            page-break-after: always;
            overflow: hidden;
          }
          .label-page:last-child {
            page-break-after: avoid;
          }
          .label-text {
            font-size: 11pt;
            font-weight: bold;
            line-height: 1.2;
            word-wrap: break-word;
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
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
            .print-btn-container {
              display: none;
            }
          }
        `}} />
      </head>
      <body>
        <div className="print-btn-container">
          <button className="print-btn" onClick={() => window.print()}>
            הדפס מדבקות ({labelsToPrint.length})
          </button>
        </div>

        {labelsToPrint.map((label) => (
          <div key={label.id} className="label-page">
            <div className="label-text">
              {label.text}
            </div>
          </div>
        ))}

        <script dangerouslySetInnerHTML={{ __html: `
          // Auto print on load
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        `}} />
      </body>
    </html>
  );
}
