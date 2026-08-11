"use server";

import { db } from "@/lib/db";
import { scannedWholesaleProducts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getLindoProducts() {
  const products = await db
    .select()
    .from(scannedWholesaleProducts)
    .orderBy(desc(scannedWholesaleProducts.scannedAt));
  
  return products;
}
