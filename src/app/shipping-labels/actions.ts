"use server";

import { db } from "@/lib/db";
import { generatedShippingLabels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteShippingLabel(id: string) {
  try {
    await db.delete(generatedShippingLabels).where(eq(generatedShippingLabels.id, id));
    revalidatePath("/shipping-labels");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete shipping label:", error);
    return { success: false, error: "Failed to delete shipping label" };
  }
}


const defaultKey = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
const velourKey = (process.env.LIONWHEEL_API_KEY_velour || "").replace(/['"]/g, '').trim() || defaultKey;
const laburaKey = (process.env.LIONWHEEL_API_KEY_labura || "").replace(/['"]/g, '').trim() || defaultKey;

export async function getLionwheelStatuses(barcodes: string[]) {
  const statuses: Record<string, string> = {};
  
  await Promise.all(
    barcodes.map(async (barcode) => {
      if (!barcode) return;
      
      const keysToTry = [...new Set([defaultKey, velourKey, laburaKey])];
      for (const key of keysToTry) {
        try {
          const url = `https://members.lionwheel.com/api/v1/tasks/show/${barcode}?key=${key}`;
          const res = await fetch(url, { next: { revalidate: 60 } }); // Cache for 60s
          if (res.ok) {
            const data = await res.json();
            if (data && data.task) {
              statuses[barcode] = data.task.status;
              break; // Stop trying keys if successful
            }
          }
        } catch (e) {
          console.error(`Failed to fetch status for barcode ${barcode} with key ${key}:`, e);
        }
      }
    })
  );
  
  return statuses;
}
