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
  requiresManagerReview: boolean;
};

async function getProductCategory(item: any): Promise<'house_brand' | 'luxury' | 'designer_dupe'> {
  // 1. Fallback to name-based rules if DB doesn't have it
  const name = (item.name || '').toLowerCase();
  
  try {
    const rules = await db.select().from(rewardBrandRules);
    for (const rule of rules) {
      if (name.includes(rule.keyword.toLowerCase())) {
        return rule.classification as 'house_brand' | 'luxury' | 'designer_dupe';
      }
    }
  } catch (error) {
    console.error("Error fetching reward brand rules:", error);
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
  
  // Cache rules for efficiency when looping over history
  const rules = await db.select().from(rewardBrandRules).catch(() => []);

  // Calculate historical house brand spend
  let historicalHouseBrandTotal = 0;
  for (const pastOrder of history.pastOrders) {
    const items = Array.isArray(pastOrder.lineItems) ? pastOrder.lineItems : [];
    for (const item of items) {
      const itemName = (item.name || '').toLowerCase();
      let isHouseBrand = false;
      for (const rule of rules) {
        if (itemName.includes(rule.keyword.toLowerCase()) && rule.classification === 'house_brand') {
          isHouseBrand = true;
          break;
        }
      }
      if (isHouseBrand) {
        historicalHouseBrandTotal += parseFloat(item.total || item.price || '0');
      }
    }
  }

  // Virtual spend: Treat every 1 ILS spent on house brands as 1.5 ILS
  // Example: 2000 house + 1000 designer = 3000 actual.
  // Virtual: (2000 * 1.5) + 1000 = 4000.
  // We can calculate this by adding (houseBrandTotal * 0.5) to totalSpent
  const virtualTotalSpent = totalSpent + (historicalHouseBrandTotal * 0.5);

  // 1. Base Score calculation (using virtual total spent)
  let score = 0;
  
  if (orderCount === 1) { // Current order is the only order
    const virtualCurrentTotal = currentTotal + (historicalHouseBrandTotal * 0.5);
    if (virtualCurrentTotal > 1500) score += 6;
    else if (virtualCurrentTotal > 800) score += 4;
    else if (virtualCurrentTotal > 400) score += 2;
    else score += 1;
  } else {
    if (virtualTotalSpent > 5000) score += 7;
    else if (virtualTotalSpent > 3000) score += 6;
    else if (virtualTotalSpent > 1500) score += 4;
    else if (virtualTotalSpent > 800) score += 2;
    else score += 1;
  }

  // Bonus for house brands in current order
  let hasHouseBrand = false;
  let hasLuxury = false;
  let houseBrandTotal = 0;
  
  const lineItems = Array.isArray(currentOrder.lineItems) ? currentOrder.lineItems : [];
  for (const item of lineItems) {
    const cat = await getProductCategory(item);
    if (cat === 'house_brand') {
      hasHouseBrand = true;
      const price = parseFloat(item.total || item.price || '0');
      houseBrandTotal += price;
    }
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
  if (currentTotal >= 1900 && hasHouseBrand) {
    gift = 'מפיץ ריח';
  } else if (currentTotal >= 1500 && hasHouseBrand) {
    gift = 'חמאת גוף';
  } else if (currentTotal >= 1000 || (currentTotal >= 800 && hasHouseBrand)) {
    gift = 'דיקאנט / בקבוק נסיעות';
  } else if (currentTotal >= 800 || (currentTotal >= 700 && hasHouseBrand)) {
    gift = 'דיקנט ריק';
  }

  // 6. Requires Manager Review
  let requiresManagerReview = false;
  if (currentTotal >= 2500) {
    requiresManagerReview = true;
  } else if (currentTotal > 0 && (houseBrandTotal / currentTotal) >= 0.7) {
    requiresManagerReview = true;
  }

  return {
    score,
    customerClass,
    sampleKit,
    gift,
    officialSample,
    requiresManagerReview
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
      requiresManagerReview: r.requiresManagerReview,
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
      requiresManagerReview: reward.requiresManagerReview,
    });
  } catch (error) {
    console.error("Failed to save order reward:", error);
  }

  return reward;
}
