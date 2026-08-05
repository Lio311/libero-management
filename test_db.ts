import { db } from "./src/lib/db";
import { bankOfTasks } from "./src/lib/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const tasks = await db.select().from(bankOfTasks).orderBy(desc(bankOfTasks.id)).limit(15);
  console.log("Tasks in DB:", tasks);
}
main();
