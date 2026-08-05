import * as xlsx from 'xlsx';
import path from 'path';

const filePath = path.join(process.cwd(), 'ליברו.xlsx');
const workbook = xlsx.readFile(filePath);

console.log("SHEETS FOUND:", workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- SHEET: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null }).slice(0, 10);
  console.log(JSON.stringify(data, null, 2));
});
