const xlsx = require('xlsx');
const workbook = xlsx.readFile('ליברו.xlsx');
console.log("Sheet names:", workbook.SheetNames);
const sheet = workbook.Sheets['בעלי תפקידים'];
if (sheet) {
  console.log(xlsx.utils.sheet_to_json(sheet));
} else {
  console.log("Sheet 'בעלי תפקידים' not found.");
}
