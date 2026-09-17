const fs = require('fs');
const { PDFDocument, degrees } = require('pdf-lib');

async function run() {
  const pdfBuffer = fs.readFileSync('captured.pdf');
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const page = pdfDoc.getPages()[0];
  
  // Rotate 90 degrees
  page.setRotation(degrees(90));
  
  fs.writeFileSync('rotated-90.pdf', await pdfDoc.save());
  console.log('Saved rotated-90.pdf');
}
run();
