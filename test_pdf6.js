const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  
  // Draw a red square at 0,0 (bottom-left)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    color: rgb(1, 0, 0),
  });
  
  // Method 1: scale then translate
  page.scaleContent(0.5, 0.5);
  // I want the square to be at 50, 50 in the new coordinates? 
  // Wait, if I translate by 50, is it 50 or 25 visually?
  page.translateContent(50, 50);

  // Let's just output and see
  const pdfBytes = await doc.save();
  fs.writeFileSync('test_scale_translate.pdf', pdfBytes);
}
run();
