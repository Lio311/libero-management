"use server";

import { db } from '@/lib/db';
import { wcProducts, monthlyTierSamples } from '@/lib/db/schema';
import { ilike, and, or, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function searchProducts(query: string) {
  if (!query || query.length < 2) return [];
  
  return await db.select({
    id: wcProducts.id,
    name: wcProducts.name,
    sku: wcProducts.sku,
  })
  .from(wcProducts)
  .where(
    or(
      ilike(wcProducts.name, `%${query}%`),
      ilike(wcProducts.sku, `%${query}%`)
    )
  )
  .limit(20);
}

export async function saveTierSamples(monthYear: string, tier: number, samples: any[]) {
  const existing = await db.select().from(monthlyTierSamples).where(
    and(
      eq(monthlyTierSamples.monthYear, monthYear),
      eq(monthlyTierSamples.tier, tier)
    )
  ).limit(1);

  if (existing.length > 0) {
    await db.update(monthlyTierSamples)
      .set({ samples, updatedAt: new Date() })
      .where(eq(monthlyTierSamples.id, existing[0].id));
  } else {
    await db.insert(monthlyTierSamples).values({
      monthYear,
      tier,
      samples,
    });
  }
  
  revalidatePath('/samples-tracking');
}
