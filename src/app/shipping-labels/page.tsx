import { db } from "@/lib/db";
import { generatedShippingLabels } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ShippingLabelsClient from "./shipping-labels-client";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ShippingLabelsPage() {
  const labels = await db
    .select()
    .from(generatedShippingLabels)
    .orderBy(desc(generatedShippingLabels.createdAt));

  return (
    <div className="flex min-h-screen bg-gray-50/50" dir="rtl">
      <Sidebar />
      <main className="flex-1">
        <ShippingLabelsClient initialLabels={labels} />
      </main>
    </div>
  );
}
