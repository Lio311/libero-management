const xlsx = require('xlsx');
const workbook = xlsx.readFile('ליברו.xlsx');
const sheet = workbook.Sheets['בעלי תפקידים'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data, null, 2));
