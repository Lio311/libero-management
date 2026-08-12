import { db } from "./src/lib/db";
import { priceHistory } from "./src/lib/db/schema";
async function main() {
  try {
    const res = await db.select().from(priceHistory).limit(1);
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
