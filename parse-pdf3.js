const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function run() {
  const pdfBuffer = fs.readFileSync('captured.pdf');
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const page = pdfDoc.getPages()[0];
  
  // Let's add borders to see what the PDF bounding box really is
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width: width, height: height, borderColor: require('pdf-lib').rgb(1, 0, 0), borderWidth: 2 });
  
  fs.writeFileSync('captured-bordered.pdf', await pdfDoc.save());
  console.log('Done bordered captured');
  
  const pdfBuffer2 = fs.readFileSync('top-label.pdf');
  const pdfDoc2 = await PDFDocument.load(pdfBuffer2);
  const page2 = pdfDoc2.getPages()[0];
  page2.drawRectangle({ x: 0, y: 0, width: width, height: height, borderColor: require('pdf-lib').rgb(1, 0, 0), borderWidth: 2 });
  fs.writeFileSync('top-label-bordered.pdf', await pdfDoc2.save());
  console.log('Done bordered top-label');
}
run();
