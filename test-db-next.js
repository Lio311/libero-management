const { db } = require('./src/lib/db');
const { creditCards, wholesaleCustomers } = require('./src/lib/db/schema');

async function main() {
  try {
    const cards = await db.select().from(creditCards);
    console.log("Cards fetched successfully:", cards.length);
  } catch (e) {
    console.error("Cards fetch error:", e);
  }
  
  try {
    const clients = await db.select().from(wholesaleCustomers);
    console.log("Clients fetched successfully:", clients.length);
  } catch (e) {
    console.error("Clients fetch error:", e);
  }
}

main().catch(console.error).finally(() => process.exit(0));
