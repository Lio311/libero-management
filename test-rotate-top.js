const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function run() {
  const pdfBuffer = fs.readFileSync('top-label.pdf');
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const page = pdfDoc.getPages()[0];
  console.log('Size:', page.getSize());
  console.log('Rotation:', page.getRotation().angle);
}
run();
