import { db } from '../src/lib/db/index';
import { wcProducts } from '../src/lib/db/schema';

async function listCategories() {
  const products = await db.select().from(wcProducts);
  const categoriesSet = new Set<string>();

  products.forEach(p => {
    if (Array.isArray(p.categories)) {
      p.categories.forEach(c => categoriesSet.add(c.name));
    }
  });

  console.log("Categories:", Array.from(categoriesSet));
}

listCategories().catch(console.error);
