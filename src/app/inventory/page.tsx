import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await db.select().from(inventoryItems).orderBy(asc(inventoryItems.brand), asc(inventoryItems.itemIndex));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ניהול מלאי</h1>
          <p className="text-muted-foreground mt-1">צפייה וניהול של פריטי המלאי במחסן</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">מותג / קטגוריה</th>
                <th className="px-6 py-4 font-medium">שם הדגם</th>
                <th className="px-6 py-4 font-medium">מחיר עלות</th>
                <th className="px-6 py-4 font-medium">רמת מלאי</th>
                <th className="px-6 py-4 font-medium">הוזמן</th>
                <th className="px-6 py-4 font-medium">הזמנה אחרונה</th>
                <th className="px-6 py-4 font-medium">מלאי נוכחי</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    אין פריטים במלאי. אנא הרץ את סקריפט הייבוא.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{item.itemIndex || "-"}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{item.brand || "-"}</td>
                    <td className="px-6 py-4 text-foreground">{item.modelName || "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.costPrice ? `₪${item.costPrice}` : "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.targetStockLevel || "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.orderedQuantity || "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.lastOrderQuantity || "-"}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{item.currentStock ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
