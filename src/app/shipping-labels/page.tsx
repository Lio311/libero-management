import { db } from "@/lib/db";
import { generatedShippingLabels } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ShippingLabelsClient from "./shipping-labels-client";

export default async function ShippingLabelsPage() {
  const labels = await db
    .select()
    .from(generatedShippingLabels)
    .orderBy(desc(generatedShippingLabels.createdAt));

  return <ShippingLabelsClient initialLabels={labels} />;
}
