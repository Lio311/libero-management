import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/lib/db';
import { creditCards, wholesaleCustomers } from './src/lib/db/schema';

async function main() {
  const cards = await db.select().from(creditCards);
  console.log('Cards count:', cards.length);
  const clients = await db.select().from(wholesaleCustomers);
  console.log('Wholesale clients count:', clients.length);
  process.exit(0);
}
main();
