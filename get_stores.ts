import { db } from "./src/lib/db";
import { wholesaleCustomers } from "./src/lib/db/schema";

async function run() {
  const clients = await db.select().from(wholesaleCustomers);
  console.log(clients.map(c => ({ id: c.id, name: c.storeName })));
  process.exit(0);
}
run();
