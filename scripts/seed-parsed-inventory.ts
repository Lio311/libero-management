import { db } from '../src/lib/db';
import { inventoryItems } from '../src/lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("Reading parsed_inventory.json...");
  const dataPath = path.join(__dirname, '../parsed_inventory.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log(`Found ${data.length} items to insert.`);

  // Clean the table first to avoid duplicates (optional but good for a fresh seed)
  console.log("Cleaning inventory_items table...");
  await db.delete(inventoryItems);

  console.log("Inserting items...");
  
  const formattedData = data.map((item: any) => ({
    brand: item.brand,
    modelName: item.modelName,
    itemIndex: isNaN(parseInt(item.itemIndex)) ? null : parseInt(item.itemIndex),
    costPrice: isNaN(parseFloat(item.costPrice)) ? null : parseFloat(item.costPrice).toString(),
    targetStockLevel: isNaN(parseFloat(item.targetStockLevel)) ? null : parseFloat(item.targetStockLevel).toString(),
    orderedQuantity: isNaN(parseInt(item.orderedQuantity)) ? null : parseInt(item.orderedQuantity),
    lastOrderQuantity: isNaN(parseInt(item.lastOrderQuantity)) ? null : parseInt(item.lastOrderQuantity),
    currentStock: isNaN(parseFloat(item.currentStock)) ? null : parseFloat(item.currentStock).toString(),
  }));

  // Insert in chunks of 50 to avoid max parameters limit
  const chunkSize = 50;
  for (let i = 0; i < formattedData.length; i += chunkSize) {
    const chunk = formattedData.slice(i, i + chunkSize);
    await db.insert(inventoryItems).values(chunk);
    console.log(`Inserted chunk ${i / chunkSize + 1}`);
  }

  console.log("Done seeding inventory!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
