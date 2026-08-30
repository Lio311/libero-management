import { config } from 'dotenv';
config({ path: '.env' });
import { db } from '../src/lib/db';
import { velourOrders } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';

// Let's manually set the URL
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_1aDl9LIcAfCH@ep-little-dust-a2p1cl0m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});
import { drizzle } from 'drizzle-orm/node-postgres';
const myDb = drizzle(pool);

async function check() {
  const o = await myDb.select().from(velourOrders).where(eq(velourOrders.id, 27441267));
  console.log("Order found:", o.length);
}
check();
