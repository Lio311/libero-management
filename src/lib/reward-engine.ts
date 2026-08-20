import { db } from "@/lib/db";
import { rewardBrandRules, orderRewards, wcProducts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { guessGender, Gender } from "./gender-utils";
import { OrderHistoryStats } from "./customer-history";

export type CustomerClass = 'בסיס' | 'היכרות' | 'המרה' | 'פרימיום' | 'VIP' | 'ליבה';
export type RewardOutput = {
  score: number;
  customerClass: CustomerClass;
  sampleKit: string;
  gift: string | null;
  officialSample: boolean;
};

async function getProductCategory(item: any): Promise<'house_brand' | 'luxury' | 'designer_dupe'> {
  if (!item.product_id) return 'designer_dupe';
  
  try {
    const prod = await db.select({ categories: wcProducts.categories }).from(wcProducts).where(eq(wcProducts.id, item.product_id)).limit(1);
    if (prod.length > 0 && prod[0].categories) {
      const cats = Array.isArray(prod[0].categories) ? prod[0].categories : [];
      
      const isHouse = cats.some((c: any) => c.id === 268 || c.name === 'מותגי הבית');
      if (isHouse) return 'house_brand';
      
      const isLuxury = cats.some((c: any) => c.id === 287 || c.name === 'בשמי יוקרה' || c.id === 57 || c.name === 'בשמי בוטיק ונישה');
      if (isLuxury) return 'luxury';
    }
  } catch (error) {
    console.error("Error fetching product category:", error);
  }
  
  return 'designer_dupe';
}

export async function calculateReward(
  currentOrder: any, 
  history: OrderHistoryStats
): Promise<RewardOutput> {
  const totalSpent = history.totalSpent;
  const orderCount = history.totalOrders;
  const currentTotal = parseFloat(currentOrder.total?.toString() || '0');
  
  const billing = currentOrder.billing || {};
  const gender = guessGender(billing.first_name || '');
  
  // 1. Base Score calculation (Naive implementation based on PRD)
  let score = 0;
  
  if (orderCount === 1) { // Current order is the only order
    if (currentTotal > 1500) score += 6;
    else if (currentTotal > 800) score += 4;
    else if (currentTotal > 400) score += 2;
    else score += 1;
  } else {
    if (totalSpent > 5000) score += 7;
    else if (totalSpent > 3000) score += 6;
    else if (totalSpent > 1500) score += 4;
    else if (totalSpent > 800) score += 2;
    else score += 1;
  }

  // Bonus for house brands in current order
  let hasHouseBrand = false;
  let hasLuxury = false;
  
  const lineItems = Array.isArray(currentOrder.lineItems) ? currentOrder.lineItems : [];
  for (const item of lineItems) {
    const cat = await getProductCategory(item);
    if (cat === 'house_brand') hasHouseBrand = true;
    if (cat === 'luxury') hasLuxury = true;
  }

  // Can get up to +3 points here. (7 + 3 = 10 max)
  if (hasHouseBrand) score += 3;
  else if (hasLuxury) score += 1;

  // Cap score to 10
  score = Math.min(10, score);

  // 2. Map score to class
  let customerClass: CustomerClass = 'בסיס';
  if (score >= 10) customerClass = 'ליבה';
  else if (score >= 9) customerClass = 'VIP';
  else if (score >= 7) customerClass = 'פרימיום';
  else if (score >= 5) customerClass = 'המרה';
  else if (score >= 3) customerClass = 'היכרות';

  // 3. Determine Sample Kit string
  const genderSuffix = gender === 'male' ? ' - גברים' : (gender === 'female' ? ' - נשים' : ' - יוניסקס/כללי');
  const sampleKit = `${customerClass}${genderSuffix}`;

  // 4. Determine Official Sample inclusion
  const officialSample = score >= 7 || (score >= 5 && hasLuxury);

  // 5. Determine Gift
  let gift = null;
  if (currentTotal >= 1200 && hasHouseBrand) {
    gift = 'מפיץ ריח';
  } else if (currentTotal >= 1500 && hasLuxury) {
    gift = 'חמאת גוף';
  } else if (currentTotal >= 800) {
    gift = 'דיקאנט / בקבוק נסיעות';
  }

  return {
    score,
    customerClass,
    sampleKit,
    gift,
    officialSample
  };
}

export async function getOrCalculateOrderReward(order: any, store: "libero" | "velour" | "labura", history: OrderHistoryStats): Promise<RewardOutput> {
  // Check if it exists in DB
  const existing = await db.select().from(orderRewards).where(
    and(
      eq(orderRewards.orderId, order.id),
      eq(orderRewards.store, store)
    )
  ).limit(1);

  if (existing.length > 0) {
    const r = existing[0];
    return {
      score: r.score,
      customerClass: r.customerClass as CustomerClass,
      sampleKit: r.sampleKit,
      gift: r.gift,
      officialSample: r.officialSample,
    };
  }

  // Calculate new
  const reward = await calculateReward(order, history);

  // Save to DB
  try {
    await db.insert(orderRewards).values({
      orderId: order.id,
      store,
      score: reward.score,
      customerClass: reward.customerClass,
      sampleKit: reward.sampleKit,
      gift: reward.gift,
      officialSample: reward.officialSample,
    });
  } catch (error) {
    console.error("Failed to save order reward:", error);
  }

  return reward;
}
