import { db } from './src/lib/db';
import { suppliers } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

const run = async () => {
  const data = await db.select().from(suppliers);
  console.log("Current suppliers length:", data.length);
  for (const s of data) {
    let newBrandName = s.brandName;
    if (s.brandName?.includes("מקדם")) {
      newBrandName = s.brandName.split('-').pop()?.trim();
    } else if (s.brandName?.includes(" - ")) {
       newBrandName = s.brandName.split('-').pop()?.trim();
    }
    
    if (newBrandName && newBrandName !== s.brandName) {
      console.log(`Updating ${s.brandName} -> ${newBrandName}`);
      await db.update(suppliers).set({ brandName: newBrandName }).where(eq(suppliers.id, s.id));
    }
  }
  console.log("Done");
}
run();
