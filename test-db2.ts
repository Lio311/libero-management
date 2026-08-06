import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// neonConfig.fetchFunction = (url: any, options: any) => fetch(url, { ...options, cache: 'no-store' });

const sql = neon(process.env.DATABASE_URL || '');
const db = drizzle(sql);

async function main() {
  try {
    const res = await sql`SELECT 1 as val`;
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
