const { PDFDocument, rgb } = require('pdf-lib');
async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
  console.log('Draw circle works');
}
run();
