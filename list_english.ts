import { db } from './src/lib/db';
import { wcProducts } from './src/lib/db/schema';

async function main() {
  const products = await db.select({ name: wcProducts.name }).from(wcProducts);
  const houseNames = [
    'תיאודורוס', 'ביירון', 'אליסיר', 'דודואר', 'פומוואה', 'פרמאסיה',
    'ארטה', 'ברגמוס', 'פיצירילי', 'קומפורטה', 'בירקהולז', 'סורה', 'אלה', 'ממוריס', 'לה בורה'
  ];
  
  for (const h of houseNames) {
    const match = products.find(p => p.name && p.name.includes(h));
    console.log(`${h}: ${match ? match.name : 'Not found'}`);
  }
  process.exit(0);
}
main().catch(console.error);
