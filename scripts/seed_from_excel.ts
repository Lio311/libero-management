import * as xlsx from 'xlsx';
import path from 'path';
import { db } from '../src/lib/db';
import { inventoryItems, teamTasks, tasks, categories } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export async function seedFromExcel(filePath: string) {
  const workbook = xlsx.readFile(filePath);

  console.log("Starting seed from Excel...");

  // 1. Parse Inventory
  console.log("Parsing Inventory sheets...");
  const inventoryData: any[] = [];
  const inventorySheets = workbook.SheetNames.filter(s => s !== 'בעלי תפקידים' && s !== 'לוז חודשי');
  
  for (const sheetName of inventorySheets) {
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    // Find the header row
    const headerRowIndex = data.findIndex(row => row.includes('שם הדגם') && row.includes('מחיר עלות'));
    if (headerRowIndex === -1) continue;
    
    // Extract brands from rows before header if any
    let currentBrands = [];
    if (headerRowIndex > 0) {
      currentBrands = data[headerRowIndex - 1].filter(c => typeof c === 'string' && c.trim().length > 0);
    }
    
    const headerRow = data[headerRowIndex];
    // Find column groups for tables (every occurrence of '#')
    const tableStarts = [];
    for (let c = 0; c < headerRow.length; c++) {
      if (headerRow[c] === 'סה"כ' || (headerRow[c] === '#' && headerRow[c-1] === 'שם הדגם')) { // Approximate start/end
         // Find exact index of #
      }
      if (headerRow[c] === '#') {
         // This is the rightmost column of a table. The leftmost is usually 8 cols to the left (סה"כ)
         tableStarts.push(c - 8);
      }
    }

    for (let r = headerRowIndex + 1; r < data.length; r++) {
      const row = data[r];
      const isRowEmpty = row.every(cell => cell === null || cell === '');
      if (isRowEmpty) continue;

      for (let i = 0; i < tableStarts.length; i++) {
        const startCol = tableStarts[i];
        if (startCol < 0) continue;

        const brand = currentBrands[i] || sheetName;
        const index = row[startCol + 8];
        const modelName = row[startCol + 7];
        const currentStock = row[startCol + 6];
        const lastOrder = row[startCol + 5];
        const ordered = row[startCol + 4];
        const targetStock = row[startCol + 3];
        const costPrice = row[startCol + 2];
        const qty = row[startCol + 1];

        if (modelName) {
          inventoryData.push({
            brand: String(brand),
            modelName: String(modelName),
            itemIndex: typeof index === 'number' ? index : null,
            costPrice: typeof costPrice === 'number' ? String(costPrice) : null,
            targetStockLevel: typeof targetStock === 'number' ? String(targetStock) : null,
            orderedQuantity: typeof ordered === 'number' ? ordered : null,
            lastOrderQuantity: typeof lastOrder === 'number' ? lastOrder : null,
            currentStock: typeof currentStock === 'number' ? currentStock : null,
          });
        }
      }
    }
  }

  if (inventoryData.length > 0) {
    console.log(`Inserting ${inventoryData.length} inventory items...`);
    await db.delete(inventoryItems);
    await db.insert(inventoryItems).values(inventoryData);
  }

  // 2. Parse Team Roles
  console.log("Parsing Team Roles (בעלי תפקידים)...");
  const teamSheet = workbook.Sheets['בעלי תפקידים'];
  if (teamSheet) {
    const data: any[][] = xlsx.utils.sheet_to_json(teamSheet, { header: 1, defval: null });
    const teamTasksData: any[] = [];
    
    // Find header row with people's names
    let headerRowIndex = -1;
    for (let r = 0; r < data.length; r++) {
      if (data[r].some(c => typeof c === 'string' && (c.includes('ליאור') || c.includes('ישראל')))) {
        headerRowIndex = r;
        break;
      }
    }

    if (headerRowIndex !== -1) {
      const headers = data[headerRowIndex];
      for (let r = headerRowIndex + 1; r < data.length; r++) {
        const row = data[r];
        for (let c = 0; c < headers.length; c++) {
          const assignee = headers[c];
          const task = row[c];
          if (assignee && typeof assignee === 'string' && task && typeof task === 'string') {
            teamTasksData.push({
              assignee: assignee.trim(),
              taskDescription: task.trim()
            });
          }
        }
      }
    }

    if (teamTasksData.length > 0) {
      console.log(`Inserting ${teamTasksData.length} team tasks...`);
      await db.delete(teamTasks);
      await db.insert(teamTasks).values(teamTasksData);
    }
  }

  // 3. Parse Calendar (לוז חודשי)
  // Simplified for this example, we keep existing tasks logic but adapt to new schema if needed
  console.log("Parsing Calendar (לוז חודשי)...");
  const calSheet = workbook.Sheets['לוז חודשי'];
  if (calSheet) {
     const data: any[][] = xlsx.utils.sheet_to_json(calSheet, { header: 1, defval: null });
     // In the analysis, the days are listed in a row (7, 6, 5, 4, 3, 2, 1) 
     // and tasks are below them. Let's parse it vertically.
     let daysRowIndex = -1;
     for (let r = 0; r < Math.min(10, data.length); r++) {
        if (data[r].some(c => typeof c === 'number' && c >= 1 && c <= 31)) {
           daysRowIndex = r;
           break;
        }
     }

     if (daysRowIndex !== -1) {
        const days = data[daysRowIndex];
        const parsedTasks: any[] = [];
        
        for (let c = 0; c < days.length; c++) {
           const day = days[c];
           if (typeof day === 'number') {
              for (let r = daysRowIndex + 1; r < data.length; r++) {
                 const taskDesc = data[r][c];
                 if (taskDesc && typeof taskDesc === 'string') {
                    parsedTasks.push({
                       title: taskDesc.trim(),
                       isRecurring: true,
                       recurrenceDay: day,
                       categoryName: 'General'
                    });
                 }
              }
           }
        }

        if (parsedTasks.length > 0) {
           console.log(`Found ${parsedTasks.length} calendar tasks...`);
           
           // Ensure category exists
           let categoryRes = await db.select().from(categories).where(eq(categories.name, 'General')).limit(1);
           let categoryId = categoryRes[0]?.id;
           if (!categoryId) {
              const inserted = await db.insert(categories).values({ name: 'General', color: '#3b82f6' }).returning();
              categoryId = inserted[0].id;
           }

           await db.delete(tasks);
           const taskInsertData = parsedTasks.map(t => ({
              title: t.title,
              categoryId: categoryId,
              isRecurring: t.isRecurring,
              recurrenceDay: t.recurrenceDay
           }));
           await db.insert(tasks).values(taskInsertData);
           console.log(`Inserted calendar tasks.`);
        }
     }
  }

  console.log("Seeding complete!");
}

// Ensure it can be run directly
if (require.main === module) {
  const filePath = path.join(process.cwd(), 'libero.xlsx');
  seedFromExcel(filePath).catch(console.error).then(() => process.exit(0));
}
