import { db } from "@/lib/db";
import { wholesaleCustomers, creditCards } from "@/lib/db/schema";
async function main() {
  const customers = await db.select().from(wholesaleCustomers);
  console.log("Wholesale Customers count:", customers.length);
  const cards = await db.select().from(creditCards);
  console.log("Credit Cards count:", cards.length);
}
main();
