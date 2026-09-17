const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function run(filename) {
  const pdfBuffer = fs.readFileSync(filename);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const page = pdfDoc.getPages()[0];
  // Dump the operations
  console.log(filename, 'operations:', page.node.Contents.asArray().length);
  // Just print some stuff about it
}
run('captured.pdf');
run('top-label.pdf');
