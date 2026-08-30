const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `const labels = await db.select().from(generatedShippingLabels)
      .where(or(
        like(generatedShippingLabels.barcode, \`%\${termClean}%\`),
        like(generatedShippingLabels.orderId, \`%\${termClean}%\`)
      ))`;
      
const replacement = `const labels = await db.select().from(generatedShippingLabels)
      .where(or(
        like(generatedShippingLabels.barcode, \`%\${translatedTerm}%\`),
        like(generatedShippingLabels.orderId, \`%\${translatedTerm}%\`),
        like(generatedShippingLabels.barcode, \`%\${termClean}%\`),
        like(generatedShippingLabels.orderId, \`%\${termClean}%\`)
      ))`;

code = code.replace(target, replacement);

const searchIdTarget = `const searchId = isNumeric ? parseInt(termClean, 10) : 0;`;
const searchIdReplacement = `const searchId = isNumeric ? parseInt(translatedTerm, 10) : 0;`;
code = code.replace(searchIdTarget, searchIdReplacement);

fs.writeFileSync(file, code);
