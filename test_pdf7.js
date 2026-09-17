const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    color: rgb(1, 0, 0),
  });
  
  // Try translate then scale
  page.translateContent(50, 50);
  page.scaleContent(0.5, 0.5);

  const pdfBytes = await doc.save();
  fs.writeFileSync('test_translate_scale.pdf', pdfBytes);
}
run();
