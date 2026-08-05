import { config } from "dotenv";
config({ path: ".env" });
import { db } from "../src/lib/db/index";
import { monthlySchedule } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  for (let i = 0; i < 3; i++) {
    try {
      console.log("Attempt", i+1);
      const res = await db.select().from(monthlySchedule).limit(1);
      console.log("Success:", res);
      break;
    } catch (err) {
      console.error("DB Error:", err);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
main();
