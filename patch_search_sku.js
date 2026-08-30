const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `const isNumeric = /^\\d+$/.test(termClean);`;
const replacement = `const hebToEng: Record<string, string> = {
      '/': 'q', '\\'': 'w', 'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
      'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
      'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.', '.': '/'
    };
    const translatedTerm = termClean.split('').map(c => hebToEng[c] || c).join('');
    const isNumeric = /^\\d+$/.test(translatedTerm);`;

code = code.replace(target, replacement);

const target2 = `const name = ((bill?.first_name || '') + ' ' + (bill?.last_name || '')).toLowerCase();
         const phone = (bill?.phone || '').toLowerCase();
         return name.includes(termClean) || phone.includes(termClean);`;
         
const replacement2 = `const name = ((bill?.first_name || '') + ' ' + (bill?.last_name || '')).toLowerCase();
         const phone = (bill?.phone || '').toLowerCase();
         // Also search line items (products) for SKU/name
         const lineItemsStr = JSON.stringify(o.lineItems || {}).toLowerCase();
         return name.includes(translatedTerm) || phone.includes(translatedTerm) || lineItemsStr.includes(translatedTerm) || name.includes(termClean) || phone.includes(termClean);`;

code = code.replace(target2, replacement2);

fs.writeFileSync(file, code);
