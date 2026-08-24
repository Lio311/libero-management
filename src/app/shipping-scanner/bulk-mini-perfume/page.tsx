import { getProcessingOrders } from "@/app/actions/scanner-actions";
import ClientPrinter from "../[orderId]/mini-perfume/ClientPrinter";

export default async function BulkMiniPerfumePage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; orderIds?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const store = (resolvedSearchParams.store || "libero") as "libero" | "velour" | "labura";
  
  const allOrders = await getProcessingOrders(store);
  
  const orderIdsParam = resolvedSearchParams.orderIds;
  const targetIds = orderIdsParam ? orderIdsParam.split(',').map(Number) : [];
  
  const orders = targetIds.length > 0 ? allOrders.filter(o => targetIds.includes(o.id)) : allOrders;

  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" }} dir="rtl">
        אין הזמנות כרגע.
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== 'undefined' && window.onPdfGeneratedBase64) {
            window.onPdfGeneratedBase64("");
          }
        `}} />
      </div>
    );
  }

  // Collect all mini perfumes across all processing orders
  const labelsToPrint = [];
  
  for (const order of orders) {
    const miniPerfumes = order.lineItems?.filter((item: any) => 
      (item.name || "").includes("מיני בושם")
    ) || [];

    for (const item of miniPerfumes) {
      const qty = item.quantity || 1;
      
      const hebrewMatch = (item.name || "").match(/^[^a-zA-Z]+/);
      let hebrewName = hebrewMatch ? hebrewMatch[0].trim() : item.name;
      hebrewName = hebrewName.replace(/[\-\|]$/, "").trim();

      let englishName = "";
      if (hebrewMatch) {
        let rest = item.name.substring(hebrewMatch[0].length);
        rest = rest.replace(/\b\d+\s*ml\b/gi, "");
        rest = rest.replace(/מיני בושם/g, "");
        rest = rest.replace(/\(travel\)/gi, "");
        rest = rest.replace(/[\u0590-\u05FF]+/g, "");
        englishName = rest.replace(/^[\-\|\s\,]+/, "").replace(/[\-\|\s\,]+$/, "").trim();
      }

      for (let i = 0; i < qty; i++) {
        labelsToPrint.push({
          id: `${order.id}-${item.id}-${i}`,
          hebrew: hebrewName,
          english: englishName,
        });
      }
    }
  }

  if (labelsToPrint.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" }} dir="rtl">
        לא נמצאו מוצרי מיני בושם באף אחת מההזמנות הפתוחות.
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== 'undefined' && window.onPdfGeneratedBase64) {
            window.onPdfGeneratedBase64("");
          }
        `}} />
      </div>
    );
  }

  return <ClientPrinter labels={labelsToPrint} orderId={"כל ההזמנות"} />;
}
