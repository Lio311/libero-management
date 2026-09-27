const fs = require('fs');
let code = fs.readFileSync('src/app/calendar-client.tsx', 'utf8');
code = code.split('text-\\[#fff\\]').join('text-[#fff]');
fs.writeFileSync('src/app/calendar-client.tsx', code);
