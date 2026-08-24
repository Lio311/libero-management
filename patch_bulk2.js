const fs = require('fs');
const file = 'src/app/shipping-scanner/bulk-mini-perfume/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /  if \(!orders \|\| orders\.length === 0\) \{\n    return \(\n      <div style=\{\{ padding: "2rem", textAlign: "center", fontSize: "1\.25rem" \}\} dir="rtl">\n        אין הזמנות כרגע\.\n      <\/div>\n    \);\n  \}/s,
  `  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", fontSize: "1.25rem" }} dir="rtl">
        אין הזמנות כרגע.
        <script dangerouslySetInnerHTML={{ __html: \`
          if (typeof window !== 'undefined' && window.onPdfGeneratedBase64) {
            window.onPdfGeneratedBase64("");
          }
        \`}} />
      </div>
    );
  }`
);

fs.writeFileSync(file, code);
