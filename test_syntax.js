const fs = require('fs');
let code = fs.readFileSync('src/app/shipping-scanner/[orderId]/scanner-client.tsx', 'utf8');
code = code.replace(/    <\/div>\n    <\/div>\n  \);\n\}/, '    </div>\n  );\n}');
fs.writeFileSync('src/app/shipping-scanner/[orderId]/scanner-client.tsx', code);
