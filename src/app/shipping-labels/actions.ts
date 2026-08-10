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


const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "c_key_ea2313a9-c33a-436a-bd4b-ed2978e51a70").replace(/['"]/g, '').trim();

export async function getLionwheelStatuses(barcodes: string[]) {
  const statuses: Record<string, string> = {};
  
  await Promise.all(
    barcodes.map(async (barcode) => {
      if (!barcode) return;
      try {
        const url = `https://members.lionwheel.com/api/v1/tasks/show/${barcode}?key=${LIONWHEEL_API_KEY}`;
        const res = await fetch(url, { next: { revalidate: 60 } }); // Cache for 60s
        if (res.ok) {
          const data = await res.json();
          if (data && data.task) {
            statuses[barcode] = data.task.status;
          }
        }
      } catch (e) {
        console.error(`Failed to fetch status for barcode ${barcode}:`, e);
      }
    })
  );
  
  return statuses;
}
