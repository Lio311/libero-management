import { db } from "./src/lib/db";
import { monthlySchedule, bankOfTasks } from "./src/lib/db/schema";

async function main() {
  const sched = await db.select().from(monthlySchedule);
  console.log("Monthly Schedule:");
  console.dir(sched, { depth: null });
  
  const bank = await db.select().from(bankOfTasks);
  console.log("Bank of Tasks:");
  console.dir(bank, { depth: null });
}

main().catch(console.error);
