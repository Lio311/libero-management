const fs = require('fs');

const routeFile = 'src/app/api/daemon-script/route.ts';
let code = fs.readFileSync(routeFile, 'utf8');

const target = `              try {
                console.log(\\\`    Downloading shipping label...\\\`);
                await downloadFile(labelUrl, tempPdfPath);
                
                console.log(\\\`    Sending to delivery printer \\\${PRINTER_DELIVERY}...\\\`);`;

const replacement = `              try {
                console.log(\\\`    Downloading shipping label...\\\`);
                const labelPage = await browser.newPage();
                await labelPage.goto(labelUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('    [Label Goto]', e.message));
                await new Promise(r => setTimeout(r, 2000));
                await labelPage.pdf({ path: tempPdfPath, width: '100mm', height: '150mm', printBackground: true });
                await labelPage.close();
                
                console.log(\\\`    Sending to delivery printer \\\${PRINTER_DELIVERY}...\\\`);`;

if (code.includes('await downloadFile(labelUrl, tempPdfPath);')) {
    code = code.replace(target, replacement);
    fs.writeFileSync(routeFile, code);
    console.log("Patched route.ts successfully!");
} else {
    console.log("Could not find target code in route.ts.");
}
