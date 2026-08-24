const fs = require('fs');
const file = 'src/app/api/daemon-script/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /await page\.goto\(targetUrl, \{ waitUntil: 'networkidle0', timeout: 30000 \}\);/,
  `await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('    [Page Goto]', e.message));`
);

code = code.replace(
  /const base64Data = pdfB64\.replace\(\/\^data:application\\\\\/pdf;base64,\/, ""\);/,
  `const base64Data = pdfB64.replace(/^data:application\\\\/pdf.*?;base64,/, "");`
);

code = code.replace(
  /if \(response\.statusCode === 301 \|\| response\.statusCode === 302\) \{/,
  `if (response.statusCode >= 400) {
         return reject(new Error("Failed to download PDF, status code: " + response.statusCode));
      }
      if (response.statusCode === 301 || response.statusCode === 302) {`
);

code = code.replace(
  /let currentResolve = null;\n  await page.exposeFunction\('onPdfGeneratedBase64', \(b64\) => {\n    if \(currentResolve\) currentResolve\(b64\);\n  }\);/s,
  `let currentResolve = null;
  await page.exposeFunction('onPdfGeneratedBase64', (b64) => {
    if (currentResolve) currentResolve(b64);
  });
  
  page.on('console', msg => console.log('    [Browser Console]', msg.text()));`
);

code = code.replace(
  /const pdfB64 = await new Promise\(async \(resolve, reject\) => \{\n                currentResolve = resolve;\n                try \{\n                  await page\.goto\(targetUrl, \{ waitUntil: 'domcontentloaded', timeout: 30000 \}\)\.catch\(e => console\.log\('    \[Page Goto\]', e\.message\)\);\n                \} catch\(e\) \{\n                  reject\(e\);\n                \}\n              \}\);/s,
  `const pdfB64 = await new Promise(async (resolve, reject) => {
                currentResolve = resolve;
                try {
                  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('    [Page Goto]', e.message));
                  
                  let waitTime = 0;
                  const interval = setInterval(() => {
                    waitTime += 1000;
                    if (!currentResolve) {
                      clearInterval(interval);
                      return;
                    }
                    if (waitTime > 30000) {
                      clearInterval(interval);
                      reject(new Error("Timeout waiting for PDF generation"));
                    }
                  }, 1000);
                } catch(e) {
                  reject(e);
                }
              });
              
              if (!pdfB64) {
                console.log("    No mini perfumes found in this order (or empty labels). Skipping print.");
                await markJobAsCompleted(job.id);
                continue;
              }`
);

fs.writeFileSync(file, code);
