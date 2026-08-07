import * as fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const dbUrlLine = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
if (dbUrlLine) process.env.DATABASE_URL = dbUrlLine.split('=').slice(1).join('=');

async function run() {
  const { db } = await import('./src/lib/db/index');
  const { wcProducts } = await import('./src/lib/db/schema');

  const res = await db.select({
    categories: wcProducts.categories
  }).from(wcProducts);
  
  const sample = res.slice(0, 10).map(r => r.categories);
  console.log(JSON.stringify(sample, null, 2));
  process.exit(0);
}
run();

