import { db } from './src/lib/db';
import { wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const products = await db.select({ name: wcProducts.name, categories: wcProducts.categories }).from(wcProducts);
  const house = new Set();
  const luxury = new Set();
  
  for (const p of products) {
    if (!p.categories) continue;
    const cats = Array.isArray(p.categories) ? p.categories : [];
    const isHouse = cats.some((c: any) => c.id === 268 || c.name === 'מותגי הבית');
    const isLuxury = cats.some((c: any) => c.id === 287 || c.name === 'בשמי יוקרה' || c.id === 57 || c.name === 'בשמי בוטיק ונישה');
    
    if (!p.name) continue;
    // Just grab the first two words to make it clearer what the product is
    const brand = p.name.split(' ').slice(0, 2).join(' ');
    
    if (isHouse) {
      house.add(brand);
    } else if (isLuxury) {
      luxury.add(brand);
    }
  }
  
  console.log("House Brands:");
  console.log(Array.from(house));
  
  console.log("\nLuxury Brands:");
  console.log(Array.from(luxury).slice(0, 50));
  process.exit(0);
}
main().catch(console.error);
