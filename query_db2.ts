import { config } from 'dotenv';
config({ path: '.env' });
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { creditCards, wholesaleCustomers } from './src/lib/db/schema';

// Strip query parameters
const cleanUrl = process.env.DATABASE_URL!.split('?')[0];
console.log('Clean URL:', cleanUrl);

const sql = neon(cleanUrl);
const db = drizzle(sql);

async function main() {
  const cards = await db.select().from(creditCards);
  console.log('Cards count:', cards.length);
  process.exit(0);
}
main();
