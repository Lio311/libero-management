const { PDFDocument, PDFName } = require('pdf-lib');

async function run() {
  const doc = await PDFDocument.create();
  // Add a page with NO contents
  doc.addPage([200, 200]);
  const base64 = await doc.saveAsBase64();
  
  // Now load it and try to embed it
  const doc2 = await PDFDocument.load(Buffer.from(base64, 'base64'));
  const newDoc = await PDFDocument.create();
  
  try {
    await newDoc.embedPdf(doc2);
    console.log("embedPdf succeeded on empty page?!");
  } catch(e) {
    console.log("embedPdf error:", e.message);
  }
}
run();
