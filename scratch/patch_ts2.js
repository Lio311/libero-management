const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `const termClean = term.replace(/[\\[\\]*]/g, '').trim().toLowerCase();
    if (!termClean) return [];

    // Search generatedShippingLabels first`;
    
const replacement = `const termClean = term.replace(/[\\[\\]*]/g, '').trim().toLowerCase();
    if (!termClean) return [];

    const hebToEng: Record<string, string> = {
      '/': 'q', '\\'': 'w', 'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
      'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
      'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.', '.': '/'
    };
    const translatedTerm = termClean.split('').map(c => hebToEng[c] || c).join('');

    // Search generatedShippingLabels first`;
    
code = code.replace(target, replacement);

const badTarget = `const hebToEng: Record<string, string> = {
      '/': 'q', '\\'': 'w', 'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
      'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
      'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.', '.': '/'
    };
    const translatedTerm = termClean.split('').map(c => hebToEng[c] || c).join('');
    const isNumeric = /^\\d+$/.test(translatedTerm);`;
    
const badReplacement = `const isNumeric = /^\\d+$/.test(translatedTerm);`;

// Only replace the second occurrence if there are two
code = code.replace(badTarget, badReplacement);

fs.writeFileSync(file, code);
