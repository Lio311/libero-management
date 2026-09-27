const fs = require('fs');
let code = fs.readFileSync('src/app/calendar-client.tsx', 'utf8');
code = code.replace(
  'className="text-2xl md:text-4xl font-light flex gap-3 items-baseline ${isLight ? "text-[#1d1d1f]" : "text-[#fff]"}"',
  'className={`text-2xl md:text-4xl font-light flex gap-3 items-baseline ${isLight ? "text-[#1d1d1f]" : "text-[#fff]"}`}'
);
fs.writeFileSync('src/app/calendar-client.tsx', code);
