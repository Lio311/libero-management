import { db } from './src/lib/db/index';
import { monthlySchedule } from './src/lib/db/schema';

async function main() {
  const data = await db.select().from(monthlySchedule);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
