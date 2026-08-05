import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as xlsx from 'xlsx';
import path from 'path';
import { db } from '../src/lib/db';
import { inventoryItems } from '../src/lib/db/schema';

async function seedInventory() {
  const filePath = path.join(process.cwd(), 'ליברו.xlsx');
  const workbook = xlsx.readFile(filePath);
  
  const inventoryData: any[] = [];
  const inventorySheets = ['הזמנות ליברו', 'הזמנות עידן', 'הפסקנו לעבוד'];
  
  for (const sheetName of inventorySheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    const tableHeaders: {r: number, c: number}[] = [];
    data.forEach((row, r) => {
      if (row) {
        row.forEach((cell, c) => {
          if (cell === '#') {
            tableHeaders.push({r, c});
          }
        });
      }
    });

    for (const {r, c} of tableHeaders) {
      let rawBrand = data[r-1]?.[c-8];
      if (!rawBrand || typeof rawBrand !== 'string' || rawBrand.trim() === '') {
        rawBrand = sheetName;
      }
      const brand = rawBrand.split('-')[0].trim();

      let currRow = r + 1;
      while (currRow < data.length) {
        const rowData = data[currRow];
        if (!rowData) break;
        
        const modelName = rowData[c - 1];
        if (!modelName || typeof modelName !== 'string' || modelName.trim() === '' || modelName.includes('סה"כ')) {
          break;
        }

        const currentStock = rowData[c - 2];
        const lastOrder = rowData[c - 3];
        const ordered = rowData[c - 4];
        const targetStock = rowData[c - 5];
        const costPrice = rowData[c - 6];
        const index = rowData[c];

        inventoryData.push({
          brand: brand,
          modelName: modelName.trim(),
          itemIndex: typeof index === 'number' ? index : null,
          costPrice: typeof costPrice === 'number' ? String(costPrice) : null,
          targetStockLevel: typeof targetStock === 'number' ? String(targetStock) : null,
          orderedQuantity: typeof ordered === 'number' ? ordered : null,
          lastOrderQuantity: typeof lastOrder === 'number' ? lastOrder : null,
          currentStock: typeof currentStock === 'number' ? String(currentStock) : null,
        });

        currRow++;
      }
    }
  }

  if (inventoryData.length > 0) {
    console.log(`Inserting ${inventoryData.length} inventory items...`);
    await db.delete(inventoryItems);
    
    const chunkSize = 50;
    for (let i = 0; i < inventoryData.length; i += chunkSize) {
      const chunk = inventoryData.slice(i, i + chunkSize);
      await db.insert(inventoryItems).values(chunk);
    }
    console.log("Successfully seeded inventory items with brands!");
  } else {
    console.log("No inventory data found.");
  }
}

seedInventory().catch(console.error).then(() => process.exit(0));
