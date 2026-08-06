import { db } from "./src/lib/db";
import { creditCards, wholesaleCustomers } from "./src/lib/db/schema";
async function main() {
  const cards = await db.select().from(creditCards);
  console.log("Cards:", cards);
  const customers = await db.select().from(wholesaleCustomers);
  console.log("Wholesale count:", customers.length);
}
main().catch(console.error);
