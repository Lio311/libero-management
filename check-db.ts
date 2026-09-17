import { db } from "./src/lib/db";
import { pendingRegularEmails } from "./src/lib/db/schema";

async function main() {
  try {
    const res = await db.select().from(pendingRegularEmails);
    console.log("Count:", res.length);
    console.log("First item:", res[0]);
  } catch (e) {
    console.error(e);
  }
}
main();
