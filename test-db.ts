import { db } from './src/lib/db/index.js';
import { monthlySchedule, bankOfTasks } from './src/lib/db/schema.js';
import { like } from 'drizzle-orm';

async function check() {
  const m = await db.select().from(monthlySchedule).where(like(monthlySchedule.taskName, '%סריקת 100 מוצרים%'));
  console.log('Monthly:', JSON.stringify(m, null, 2));
  
  const b = await db.select().from(bankOfTasks).where(like(bankOfTasks.taskName, '%סריקת 100 מוצרים%'));
  console.log('Bank:', JSON.stringify(b, null, 2));
}
check();
