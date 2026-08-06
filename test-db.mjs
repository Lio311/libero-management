import { db } from './src/db/index.js';
import { monthlySchedule } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const existing = await db.select().from(monthlySchedule).where(eq(monthlySchedule.task, 'פגישת מלאי'));
  if (existing.length === 0) {
    console.log("Adding פגישת מלאי...");
    await db.insert(monthlySchedule).values({
      task: 'פגישת מלאי',
      status: 'לא התחיל',
      weekNumber: 15
    });
    console.log("Added.");
  } else {
    console.log("Already exists.");
  }
  process.exit(0);
}
main();
