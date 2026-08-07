const fs = require('fs');
const content = fs.readFileSync('node_modules/@base-ui/react/dist/index.d.ts', 'utf-8');
console.log(content.includes('Value:'));
