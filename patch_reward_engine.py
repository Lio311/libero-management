import re

with open('src/lib/reward-engine.ts', 'r') as f:
    content = f.read()

imports = """import { db } from "@/lib/db";
import { rewardBrandRules, orderRewards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
"""

content = imports + content

# Replace getProductCategory to use DB
new_getProductCategory = """async function getProductCategory(item: any): Promise<'house_brand' | 'luxury' | 'designer_dupe'> {
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
}"""

# Find old getProductCategory and replace
old_getProductCategory = """// MOCK: This needs to be defined by the user
function getProductCategory(item: any): 'house_brand' | 'luxury' | 'designer_dupe' {
  const name = (item.name || '').toLowerCase();
  
  // Very naive classification for now
  if (name.includes('velour') || name.includes('labura') || name.includes('libero')) return 'house_brand';
  if (name.includes('creed') || name.includes('roja') || name.includes('xerjoff') || name.includes('amouage') || name.includes('parfums de marly')) return 'luxury';
  
  return 'designer_dupe';
}"""

content = content.replace(old_getProductCategory, new_getProductCategory)

# Change calculateReward to be async
content = content.replace("export function calculateReward(", "export async function calculateReward(")

# Change getProductCategory call to await inside calculateReward
old_loop = """  lineItems.forEach((item: any) => {
    const cat = getProductCategory(item);
    if (cat === 'house_brand') hasHouseBrand = true;
    if (cat === 'luxury') hasLuxury = true;
  });"""

new_loop = """  for (const item of lineItems) {
    const cat = await getProductCategory(item);
    if (cat === 'house_brand') hasHouseBrand = true;
    if (cat === 'luxury') hasLuxury = true;
  }"""

content = content.replace(old_loop, new_loop)

# Add a function to get or calculate reward
new_function = """
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
"""

content += new_function

with open('src/lib/reward-engine.ts', 'w') as f:
    f.write(content)

