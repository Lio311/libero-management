import { db } from "./src/lib/db";
import { bankOfTasks } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const items = await db.select().from(bankOfTasks).where(eq(bankOfTasks.taskName, 'Test Task from Script'));
  console.log("Found:", items);
}
main();
