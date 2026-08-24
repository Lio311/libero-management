const fs = require('fs');
const file = 'src/app/shipping-scanner/bulk-mini-perfume/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /return \(\s*<div style=\{\{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" \}\} dir="rtl">\s*לא נמצאו מוצרי מיני בושם באף אחת מההזמנות הפתוחות\.\s*<\/div>\s*\);/m,
  `return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" }} dir="rtl">
        לא נמצאו מוצרי מיני בושם באף אחת מההזמנות הפתוחות.
        <script dangerouslySetInnerHTML={{ __html: \`
          if (typeof window !== 'undefined' && window.onPdfGeneratedBase64) {
            window.onPdfGeneratedBase64("");
          }
        \`}} />
      </div>
    );`
);

fs.writeFileSync(file, code);
