 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as xlsx from 'xlsx';
import { db } from '../src/lib/db';
import { bankOfTasks } from '../src/lib/db/schema';
import { config } from 'dotenv';

config();

async function importTasks() {
  console.log("Reading excel file...");
  const wb = xlsx.readFile('ליברו.xlsx');
  const sheet = wb.Sheets['בנק משימות'];
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1}) as any[][];
  
  // Columns: [ "אחראי", "משימות", "סטטוס ביצוע", "משימה", "תאריך", "#" ]
  const rowsToInsert = [];
  
  // Start from row 4 (index 4) based on our analysis
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Check if the task name exists (index 3)
    const taskName = row[3];
    if (!taskName) continue;
    
    rowsToInsert.push({
      assignee: row[0] || 'Unassigned',
      status: row[2] || 'לא התחיל',
      taskName: String(taskName),
      dueDate: row[4] ? String(row[4]) : null,
      itemIndex: parseInt(row[5]) || null,
    });
  }
  
  console.log(`Found ${rowsToInsert.length} tasks. Inserting...`);
  
  if (rowsToInsert.length > 0) {
    try {
      await db.insert(bankOfTasks).values(rowsToInsert);
      console.log("Successfully imported tasks.");
    } catch (e) {
      console.error("Error inserting:", e);
    }
  } else {
    console.log("No tasks to insert.");
  }
  
  process.exit(0);
}

importTasks();
