import { config } from 'dotenv';
config({ path: '.env' });
import { db } from '../src/lib/db';
import { generatedShippingLabels } from '../src/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
import { drizzle } from 'drizzle-orm/node-postgres';
const myDb = drizzle(pool);

async function check() {
  const l = await myDb.select().from(generatedShippingLabels).where(like(generatedShippingLabels.barcode, '%27441267%'));
  console.log("Labels:", l);
}
check();
