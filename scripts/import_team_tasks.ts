 
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../src/lib/db";
import { teamTasks } from "../src/lib/db/schema";
import * as xlsx from "xlsx";

async function main() {
  console.log("Reading Excel file...");
  const workbook = xlsx.readFile("ליברו.xlsx");
  const sheet = workbook.Sheets["בעלי תפקידים"];
  
  if (!sheet) {
    console.error("Sheet 'בעלי תפקידים' not found.");
    process.exit(1);
  }

  // Read as array of arrays
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  
  // Find the header row (the first row with actual string values)
  let headerRowIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i].length > 0 && typeof data[i][0] === 'string') {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    console.error("Could not find headers in 'בעלי תפקידים' sheet.");
    process.exit(1);
  }

  const assignees = data[headerRowIdx];
  const newTasks = [];

  for (let colIdx = 0; colIdx < assignees.length; colIdx++) {
    const assignee = assignees[colIdx];
    if (!assignee) continue;

    for (let rowIdx = headerRowIdx + 1; rowIdx < data.length; rowIdx++) {
      const taskDesc = data[rowIdx][colIdx];
      if (taskDesc && typeof taskDesc === 'string' && taskDesc.trim() !== '') {
        newTasks.push({
          assignee: assignee.trim(),
          taskDescription: taskDesc.trim(),
        });
      }
    }
  }

  if (newTasks.length === 0) {
    console.log("No tasks found to import.");
    process.exit(0);
  }

  console.log(`Found ${newTasks.length} tasks for ${assignees.filter(Boolean).length} team members. Importing to database...`);

  try {
    // Clear existing data to avoid duplicates
    console.log("Clearing existing team tasks...");
    await db.delete(teamTasks);

    console.log("Inserting new tasks...");
    await db.insert(teamTasks).values(newTasks);
    
    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Error inserting into database:", error);
  }
}

main().catch(console.error);
