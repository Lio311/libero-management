import { db } from "@/lib/db";
import { generatedShippingLabels } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ShippingLabelsClient from "./shipping-labels-client";
import { getLionwheelStatuses } from "./actions";

export default async function ShippingLabelsPage() {
  const labels = await db
    .select()
    .from(generatedShippingLabels)
    .orderBy(desc(generatedShippingLabels.createdAt));

  const barcodes = labels.map((l) => l.barcode).filter(Boolean) as string[];
  const statuses = await getLionwheelStatuses(barcodes);

  return <ShippingLabelsClient initialLabels={labels} initialStatuses={statuses} />;
}
