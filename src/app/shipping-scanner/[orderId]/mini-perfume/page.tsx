import { getOrderById } from "@/app/actions/scanner-actions";
import ClientPrinter from "./ClientPrinter";

export default async function MiniPerfumePage({
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
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" }} dir="rtl">
        הזמנה לא נמצאה.
      </div>
    );
  }

  // Filter items that have "מיני בושם" in their name
  const miniPerfumes = order.lineItems.filter((item: any) => 
    (item.name || "").includes("מיני בושם")
  );

  if (miniPerfumes.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" }} dir="rtl">
        לא נמצאו מוצרי מיני בושם בהזמנה זו.
      </div>
    );
  }

  // Create an array of labels based on quantities
  const labelsToPrint = [];
  for (const item of miniPerfumes) {
    const qty = item.quantity || 1;
    
    // Extract text up to the first English letter
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

  return <ClientPrinter labels={labelsToPrint} orderId={order.id} />;
}
