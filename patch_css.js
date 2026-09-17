const fs = require('fs');
let code = fs.readFileSync('src/app/api/daemon-script/route.ts', 'utf8');

// Change the style tag to add a massive left margin to the body
code = code.replace(
  "await labelPage.addStyleTag({ content: 'body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; } @page { margin: 0 !important; }' });",
  "await labelPage.addStyleTag({ content: 'body { padding-left: 30px !important; } html, body { overflow: hidden !important; } @page { margin: 0 !important; }' });"
);

// We can also increase the Puppeteer PDF margin just in case
code = code.replace(
  "margin: { top: '2mm', right: '0mm', bottom: '0mm', left: '8mm' },",
  "margin: { top: '2mm', right: '0mm', bottom: '0mm', left: '25mm' },"
);

fs.writeFileSync('src/app/api/daemon-script/route.ts', code);
