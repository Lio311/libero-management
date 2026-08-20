import { db } from './src/lib/db';
import { wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(wcProducts);
  console.log('Count:', result[0].count);
  process.exit(0);
}
main();
