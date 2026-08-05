import * as xlsx from 'xlsx';
import path from 'path';

export function parseExcelAndExtractTasks(filePath: string) {
  const workbook = xlsx.readFile(filePath);
  
  // We want the 'לוז חודשי' sheet
  const sheetName = workbook.SheetNames.find(s => s.includes('לוז חודשי'));
  if (!sheetName) {
    throw new Error('Sheet "לוז חודשי" not found in the Excel file');
  }

  const sheet = workbook.Sheets[sheetName];
  
  // Read as a raw array of arrays to handle multiple tables
  const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  const tables: any[][][] = [];
  let currentTable: any[][] = [];

  // Identify contiguous blocks of data (tables)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const isRowEmpty = row.every(cell => cell === null || cell === '');
    
    if (isRowEmpty) {
      if (currentTable.length > 0) {
        tables.push(currentTable);
        currentTable = [];
      }
    } else {
      currentTable.push(row);
    }
  }
  
  if (currentTable.length > 0) {
    tables.push(currentTable);
  }

  const tasks: { title: string; categoryName: string; isRecurring: boolean; recurrenceDay?: number }[] = [];

  // Very basic heuristic for tasks table: Look for headers like "משימה", "תאריך", "קטגוריה"
  tables.forEach(table => {
    if (table.length < 2) return;
    
    // Assume first row is header
    const headers = table[0].map(h => String(h || '').trim());
    
    // Check if it's a tasks table
    const taskColIdx = headers.findIndex(h => h.includes('משימה') || h.includes('שם'));
    const dateColIdx = headers.findIndex(h => h.includes('תאריך') || h.includes('יום'));
    const categoryColIdx = headers.findIndex(h => h.includes('קטגוריה') || h.includes('סוג'));

    if (taskColIdx !== -1) {
      // It's a task table! Parse rows
      for (let r = 1; r < table.length; r++) {
        const row = table[r];
        const title = row[taskColIdx];
        if (!title) continue;

        const categoryName = categoryColIdx !== -1 ? (row[categoryColIdx] || 'General') : 'General';
        
        let isRecurring = true; // Assuming לוז חודשי tasks are recurring by default unless specified
        let recurrenceDay = 1; 

        if (dateColIdx !== -1) {
          const dateVal = row[dateColIdx];
          // Try to extract a day number (1-31)
          if (typeof dateVal === 'number' && dateVal >= 1 && dateVal <= 31) {
            recurrenceDay = dateVal;
          } else if (typeof dateVal === 'string') {
            const parsed = parseInt(dateVal, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
              recurrenceDay = parsed;
            }
          }
        }

        tasks.push({
          title: String(title),
          categoryName: String(categoryName),
          isRecurring,
          recurrenceDay
        });
      }
    }
  });

  return tasks;
}

// In a real execution, we would call this and insert into DB.
// e.g., 
// const tasks = parseExcelAndExtractTasks(path.join(process.cwd(), 'ליברו.xlsx'));
// console.log(tasks);
