const fs = require('fs');

const fileList = 'src/app/shipping-scanner/scanner-list-client.tsx';
let codeList = fs.readFileSync(fileList, 'utf8');

codeList = codeList.replace(/הדפס בושם במחשב \(\$\{selectedOrderIds\.length\}\)/g, 'הדפס מדבקות במחשב (${selectedOrderIds.length})');
codeList = codeList.replace(/"הדפס בושם במחשב"/g, '"הדפס מדבקות במחשב"');

codeList = codeList.replace(/הדפס משלוח במחשב \(\$\{selectedOrderIds\.length\}\)/g, 'הדפס לייבל משלוח במחשב (${selectedOrderIds.length})');
codeList = codeList.replace(/"הדפס משלוח במחשב"/g, '"הדפס לייבל משלוח במחשב"');

fs.writeFileSync(fileList, codeList);

const fileSingle = 'src/app/shipping-scanner/[orderId]/scanner-client.tsx';
let codeSingle = fs.readFileSync(fileSingle, 'utf8');

codeSingle = codeSingle.replace(/>\s*הדפס דוגמיות \(במחשב\)\s*<\/button>/, '>\n              הדפס מדבקות (במחשב)\n            </button>');
codeSingle = codeSingle.replace(/>\s*\{isPrinting \? "מפיק מדבקה\.\.\." : "הדפס לייבל \(במחשב\)"\}\s*<\/button>/, '>\n              {isPrinting ? "מפיק מדבקה..." : "הדפס לייבל משלוח (במחשב)"}\n            </button>');

fs.writeFileSync(fileSingle, codeSingle);

