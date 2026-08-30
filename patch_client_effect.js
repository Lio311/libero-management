const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `const term = searchTerm.trim().replace(/[\\[\\]*]/g, '');`;
const replacement = `const termRaw = searchTerm.trim().replace(/[\\[\\]*]/g, '');
      const hebToEng: Record<string, string> = {
        '/': 'q', '\\'': 'w', 'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
        'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
        'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.', '.': '/'
      };
      const term = termRaw.split('').map(c => hebToEng[c] || c).join('');`;
code = code.replace(target, replacement);
fs.writeFileSync(file, code);
