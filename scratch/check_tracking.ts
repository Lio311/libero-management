import { config } from 'dotenv';
config({ path: '.env' });
import { db } from '../src/lib/db';
import { generatedShippingLabels } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
  try {
    const label = await db.select().from(generatedShippingLabels).where(eq(generatedShippingLabels.barcode, '27441267'));
    console.log('Found label:', label);
  } catch(e: any) {
    console.error(e.message);
  }
}
check();
