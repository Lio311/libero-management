with open('src/lib/reward-engine.ts', 'r') as f:
    content = f.read()

old_func = """async function getProductCategory(item: any): Promise<'house_brand' | 'luxury' | 'designer_dupe'> {
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

new_func = """import { wcProducts } from "@/lib/db/schema";

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
}"""

content = content.replace(old_func, new_func)

# Also need to fix imports if I added wcProducts but it's already in schema.
# wait, schema import is `import { rewardBrandRules, orderRewards } from "@/lib/db/schema";`
content = content.replace('import { rewardBrandRules, orderRewards } from "@/lib/db/schema";', 'import { rewardBrandRules, orderRewards, wcProducts } from "@/lib/db/schema";')
content = content.replace('import { wcProducts } from "@/lib/db/schema";\n\nasync function', 'async function')

with open('src/lib/reward-engine.ts', 'w') as f:
    f.write(content)
