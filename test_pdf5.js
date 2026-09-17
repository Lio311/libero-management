const { PDFDocument } = require('pdf-lib');
async function run() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const base64 = await doc.saveAsBase64();
  
  const doc2 = await PDFDocument.load(Buffer.from(base64, 'base64'));
  const pages = doc2.getPages();
  for (const page of pages) {
    page.scaleContent(0.82, 0.82);
    page.translateContent(10, 10);
  }
  await doc2.saveAsBase64();
  console.log("Success with scaleContent on empty page");
}
run();
