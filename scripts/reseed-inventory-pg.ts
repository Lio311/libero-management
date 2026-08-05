 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as xlsx from 'xlsx';
import path from 'path';
import { Client } from 'pg';

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
          model_name: modelName.trim(),
          item_index: typeof index === 'number' ? index : null,
          cost_price: typeof costPrice === 'number' ? String(costPrice) : null,
          target_stock_level: typeof targetStock === 'number' ? String(targetStock) : null,
          ordered_quantity: typeof ordered === 'number' ? ordered : null,
          last_order_quantity: typeof lastOrder === 'number' ? lastOrder : null,
          current_stock: typeof currentStock === 'number' ? String(currentStock) : null,
        });

        currRow++;
      }
    }
  }

  if (inventoryData.length > 0) {
    console.log(`Inserting ${inventoryData.length} inventory items...`);
    
    const client = new Client({
      connectionString: 'postgresql://neondb_owner:npg_1aDl9LIcAfCH@ep-little-dust-a2p1cl0m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    });
    await client.connect();
    
    await client.query('DELETE FROM inventory_items;');
    
    for (const item of inventoryData) {
      const query = `
        INSERT INTO inventory_items (brand, model_name, item_index, cost_price, target_stock_level, ordered_quantity, last_order_quantity, current_stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      const values = [
        item.brand,
        item.model_name,
        item.item_index,
        item.cost_price,
        item.target_stock_level,
        item.ordered_quantity,
        item.last_order_quantity,
        item.current_stock
      ];
      await client.query(query, values);
    }

    await client.end();
    console.log("Successfully seeded inventory items with brands!");
  } else {
    console.log("No inventory data found.");
  }
}

seedInventory().catch(console.error).then(() => process.exit(0));
