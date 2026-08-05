import * as xlsx from 'xlsx';
import path from 'path';
import { db } from '../src/lib/db';
import {
  inventoryItems, teamTasks, tasks, categories,
  importPayments, creditCards, chinaOrders,
  influencers, influencerPayments, suppliers,
  wholesaleCustomers, roleHolders, monthlySchedule
} from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export async function seedFromExcel(filePath: string) {
  const workbook = xlsx.readFile(filePath);
  console.log("Starting seed from Excel...");

  // 1. תשלומים יבוא (Import Payments)
  const importSheet = workbook.Sheets['תשלומים יבוא'];
  if (importSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(importSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      parsed.push({
        shippingCost: row[0] ? String(row[0]) : null,
        vat: row[1] ? String(row[1]) : null,
        orderAmountNis: row[2] ? String(row[2]) : null,
        orderAmountForeign: row[3] ? String(row[3]) : null,
        brand: row[4] ? String(row[4]) : null,
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} import payments...`);
      await db.delete(importPayments);
      await db.insert(importPayments).values(parsed);
    }
  }

  // 2. כרטיסי אשראי (Credit Cards)
  const ccSheet = workbook.Sheets['כרטיסי אשראי'];
  if (ccSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(ccSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      parsed.push({
        cvv: row[1] ? String(row[1]) : null,
        expiration: row[2] ? String(row[2]) : null,
        cardNumber: row[3] ? String(row[3]) : null,
        creditLimit: row[4] ? String(row[4]) : null,
        bank: row[5] ? String(row[5]) : null,
        cardCompany: row[6] ? String(row[6]) : null,
        cardType: 'עסקי', // Default
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} credit cards...`);
      await db.delete(creditCards);
      await db.insert(creditCards).values(parsed);
    }
  }

  // 3. ניהול ספקים (Suppliers)
  const supSheet = workbook.Sheets['ניהול ספקים חדשים וישנים'];
  if (supSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(supSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      if (row[2]) {
        parsed.push({
          brandName: String(row[2]),
          contactStatus: String(row[1]),
          notes: String(row[0]),
        });
      }
      if (row[7]) {
        parsed.push({
          brandName: String(row[7]),
          inventoryStatus: String(row[6]),
          planningStatus: String(row[5]),
        });
      }
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} suppliers...`);
      await db.delete(suppliers);
      await db.insert(suppliers).values(parsed);
    }
  }

  // 4. מסין (China Orders)
  const chinaSheet = workbook.Sheets['הזמנות מסין'];
  if (chinaSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(chinaSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      parsed.push({
        arrivalDate: row[0] ? String(row[0]) : null,
        products: row[1] ? String(row[1]) : null,
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} china orders...`);
      await db.delete(chinaOrders);
      await db.insert(chinaOrders).values(parsed);
    }
  }

  // 5. שיווק (Marketing)
  const marketSheet = workbook.Sheets['שיווק'];
  if (marketSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(marketSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      parsed.push({
        brand: row[9] ? String(row[9]) : null,
        isPaid: row[8] ? String(row[8]) : null,
        videoCount: row[7] ? String(row[7]) : null,
        postCount: row[6] ? String(row[6]) : null,
        activities: row[5] ? String(row[5]) : null,
        influencerName: row[3] ? String(row[3]) : null,
        productsGiven: row[2] ? String(row[2]) : null,
        videosUploaded: row[1] ? String(row[1]) : null,
        notes: row[0] ? String(row[0]) : null,
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} influencers...`);
      await db.delete(influencers);
      await db.insert(influencers).values(parsed);
    }
  }

  // 6. תשלום משפיענים (Influencer Payments)
  const paySheet = workbook.Sheets['תשלום משפיענים'];
  if (paySheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(paySheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      if (row[10]) {
        parsed.push({
          influencerName: String(row[10]),
          amount: row[2] ? String(row[2]) : null,
          isDone: row[1] ? String(row[1]) : null,
        });
      }
      if (row[14]) {
        parsed.push({
          influencerName: String(row[14]),
          amount: row[13] ? String(row[13]) : null,
          isDone: row[12] ? String(row[12]) : null,
        });
      }
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} influencer payments...`);
      await db.delete(influencerPayments);
      await db.insert(influencerPayments).values(parsed);
    }
  }

  // 7. סיטונאות (Wholesale)
  const wholesaleSheet = workbook.Sheets['סיטונאות'];
  if (wholesaleSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(wholesaleSheet, { header: 1, defval: null });
    const parsed = [];
    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || row.every(c => c === null || c === '')) continue;
      parsed.push({
        storeName: row[7] ? String(row[7]) : null,
        city: row[6] ? String(row[6]) : null,
        address: row[5] ? String(row[5]) : null,
        phoneCall: row[4] ? String(row[4]) : null,
        visit: row[3] ? String(row[3]) : null,
        potential: row[2] ? String(row[2]) : null,
        interest: row[1] ? String(row[1]) : null,
        notes: row[0] ? String(row[0]) : null,
      });
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} wholesale customers...`);
      await db.delete(wholesaleCustomers);
      await db.insert(wholesaleCustomers).values(parsed);
    }
  }

  // 8. בעלי תפקידים (Roles)
  console.log("Parsing Team Roles (בעלי תפקידים)...");
  const teamSheet = workbook.Sheets['בעלי תפקידים'];
  if (teamSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(teamSheet, { header: 1, defval: null });
    const parsed = [];
    if (data[3]) {
      const headers = data[3];
      for (let r = 4; r < data.length; r++) {
        const row = data[r];
        if (!row || row.every(c => c === null || c === '')) continue;
        for (let c = 0; c < headers.length; c++) {
          const assignee = headers[c];
          const task = row[c];
          if (assignee && task) {
            parsed.push({
              name: String(assignee).trim(),
              role: String(task).trim()
            });
          }
        }
      }
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} role holders...`);
      await db.delete(roleHolders);
      await db.insert(roleHolders).values(parsed);
    }
  }

  // 9. לוז חודשי (Schedule)
  const calSheet = workbook.Sheets['לוז חודשי'];
  if (calSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(calSheet, { header: 1, defval: null });
    const parsed = [];
    if (data[3]) {
      const days = data[3];
      for (let c = 0; c < days.length; c++) {
        const day = days[c];
        if (typeof day === 'number') {
          for (let r = 4; r < data.length; r++) {
            const taskDesc = data[r][c];
            if (taskDesc) {
              parsed.push({
                weekNumber: day,
                task: String(taskDesc).trim()
              });
            }
          }
        }
      }
    }
    if (parsed.length > 0) {
      console.log(`Inserting ${parsed.length} monthly schedule tasks...`);
      await db.delete(monthlySchedule);
      await db.insert(monthlySchedule).values(parsed);
    }
  }

  // 10. Inventory parsing
  console.log("Parsing Inventory sheets...");
  const inventoryData: any[] = [];
  const inventorySheets = ['הזמנות ליברו', 'הזמנות עידן', 'הפסקנו לעבוד'];
  
  for (const sheetName of inventorySheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    let headerRowIndex = -1;
    for (let r = 0; r < 5; r++) {
      if (data[r] && data[r].includes('שם הדגם') && data[r].includes('מלאי נוכחי')) {
        headerRowIndex = r;
        break;
      }
    }
    
    if (headerRowIndex !== -1) {
      let currentBrands: any[] = [];
      if (headerRowIndex > 0 && data[headerRowIndex - 1]) {
        currentBrands = data[headerRowIndex - 1];
      }
      
      const headerRow = data[headerRowIndex];
      const tableStarts = [];
      for (let c = 0; c < headerRow.length; c++) {
        if (headerRow[c] === '#') {
          tableStarts.push(c - 8);
        }
      }

      for (let r = headerRowIndex + 1; r < data.length; r++) {
        const row = data[r];
        if (!row || row.every(cell => cell === null || cell === '')) continue;

        for (let i = 0; i < tableStarts.length; i++) {
          const startCol = tableStarts[i];
          if (startCol < 0) continue;

          let brand = currentBrands[startCol + 7] || sheetName;
          if (!brand || brand === '') brand = sheetName;
          
          const index = row[startCol + 8];
          const modelName = row[startCol + 7];
          const currentStock = row[startCol + 6];
          const lastOrder = row[startCol + 5];
          const ordered = row[startCol + 4];
          const targetStock = row[startCol + 3];
          const costPrice = row[startCol + 2];

          if (modelName) {
            inventoryData.push({
              brand: String(brand).replace(/ - מקדם.*/, '').trim(),
              modelName: String(modelName).trim(),
              itemIndex: typeof index === 'number' ? index : null,
              costPrice: typeof costPrice === 'number' ? String(costPrice) : null,
              targetStockLevel: typeof targetStock === 'number' ? String(targetStock) : null,
              orderedQuantity: typeof ordered === 'number' ? ordered : null,
              lastOrderQuantity: typeof lastOrder === 'number' ? lastOrder : null,
              currentStock: typeof currentStock === 'number' ? String(currentStock) : null,
            });
          }
        }
      }
    }
  }

  if (inventoryData.length > 0) {
    console.log(`Inserting ${inventoryData.length} inventory items...`);
    await db.delete(inventoryItems);
    await db.insert(inventoryItems).values(inventoryData);
  }

  console.log("Seeding complete!");
}

if (require.main === module) {
  const filePath = path.join(process.cwd(), 'ליברו.xlsx');
  seedFromExcel(filePath).catch(console.error).then(() => process.exit(0));
}
