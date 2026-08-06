import { db } from "./src/lib/db/index.js";
import { influencers } from "./src/lib/db/schema.js";

async function main() {
  const result = await db.select().from(influencers);
  console.log(result);
  process.exit(0);
}
main();
