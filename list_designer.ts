import { db } from './src/lib/db';
import { wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const products = await db.select({ name: wcProducts.name, categories: wcProducts.categories }).from(wcProducts);
  const designer = new Map();
  
  for (const p of products) {
    if (!p.categories) continue;
    const cats = Array.isArray(p.categories) ? p.categories : [];
    const isHouse = cats.some((c: any) => c.id === 268 || c.name === 'מותגי הבית');
    const isLuxury = cats.some((c: any) => c.id === 287 || c.name === 'בשמי יוקרה' || c.id === 57 || c.name === 'בשמי בוטיק ונישה');
    
    if (isHouse || isLuxury) continue; // Skip if they give bonus points
    
    if (!p.name) continue;
    // Get the first word
    const brand = p.name.split(' ')[0];
    designer.set(brand, (designer.get(brand) || 0) + 1);
  }
  
  // Sort by popularity (number of products)
  const sorted = Array.from(designer.entries()).sort((a, b) => b[1] - a[1]);
  
  console.log("Top Designer/Other Brands:");
  for (const [b, count] of sorted.slice(0, 40)) {
    console.log(`${b} (${count} items)`);
  }
  process.exit(0);
}
main().catch(console.error);
