import { db } from './src/lib/db/index';
import { wholesaleCustomers } from './src/lib/db/schema';
async function main() {
  const all = await db.select().from(wholesaleCustomers);
  console.log('Count:', all.length);
  process.exit(0);
}
main();
