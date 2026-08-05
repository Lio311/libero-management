import { db } from "../src/lib/db";
import { bankOfTasks, importPayments, suppliers } from "../src/lib/db/schema";
import fs from "fs";
import { sql } from "drizzle-orm";

async function main() {
  const data = JSON.parse(fs.readFileSync("remaining_data.json", "utf-8"));

  // Bank of tasks
  if (data.bankOfTasks && data.bankOfTasks.length > 0) {
    console.log(`Inserting ${data.bankOfTasks.length} bank of tasks...`);
    await db.delete(bankOfTasks);
    for (const item of data.bankOfTasks) {
      await db.insert(bankOfTasks).values({
        itemIndex: item.itemIndex ? parseInt(item.itemIndex, 10) : null,
        dueDate: item.dueDate,
        taskName: item.taskName,
        status: item.status,
        assignee: item.assignee,
      });
    }
  }

  // Import payments
  if (data.importPayments && data.importPayments.length > 0) {
    console.log(`Inserting ${data.importPayments.length} import payments...`);
    await db.delete(importPayments);
    for (const item of data.importPayments) {
      await db.insert(importPayments).values({
        brand: item.brand,
        orderAmountForeign: item.orderAmountForeign ? item.orderAmountForeign.replace(/[^0-9.-]+/g,"") : null,
        orderAmountNis: item.orderAmountNis ? item.orderAmountNis.replace(/[^0-9.-]+/g,"") : null,
        vat: item.vat ? item.vat.replace(/[^0-9.-]+/g,"") : null,
        shippingCost: item.shippingCost ? item.shippingCost.replace(/[^0-9.-]+/g,"") : null,
      });
    }
  }

  // Suppliers
  if (data.suppliers && data.suppliers.length > 0) {
    console.log(`Inserting ${data.suppliers.length} suppliers...`);
    await db.delete(suppliers);
    for (const item of data.suppliers) {
      await db.insert(suppliers).values({
        brandName: item.brandName,
        inventoryStatus: item.inventoryStatus,
        planningStatus: item.planningStatus,
        contactStatus: item.contactStatus,
        notes: item.notes,
      });
    }
  }

  console.log("Remaining Seed Complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding remaining data:", err);
  process.exit(1);
});
