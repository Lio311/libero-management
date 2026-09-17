const fs = require('fs');
let code = fs.readFileSync('src/app/api/daemon-script/route.ts', 'utf8');

code = code.replace(
  "margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },",
  "margin: { top: '2mm', right: '0mm', bottom: '0mm', left: '8mm' },"
);
code = code.replace(
  "scale: 0.90",
  "scale: 0.88"
);

fs.writeFileSync('src/app/api/daemon-script/route.ts', code);
