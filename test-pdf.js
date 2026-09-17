const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([150 * 2.83, 100 * 2.83]); // 150x100mm in points (~425x283)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Draw something in the landscape page
  page.drawRectangle({ x: 0, y: 0, width: 425, height: 283, borderColor: rgb(1,0,0), borderWidth: 2 });
  page.drawText('Landscape Label 150x100', { x: 50, y: 250, size: 24, font });
  page.drawText('BARCODE HERE', { x: 50, y: 150, size: 40, font });
  
  fs.writeFileSync('original.pdf', await pdfDoc.save());
}

async function fixTestPDF() {
  const pdfBuffer = fs.readFileSync('original.pdf');
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  let { width, height } = page.getSize();
  
  console.log('Original size:', width, height);
  
  if (width > height) {
    const targetWidth = height;
    const targetHeight = width;
    
    const scale = targetWidth / width;
    console.log('Scale:', scale);
    
    page.setSize(targetWidth, targetHeight);
    page.scaleContent(scale, scale);
    
    const contentHeight = height * scale;
    page.translateContent(0, targetHeight - contentHeight);
  }
  
  fs.writeFileSync('fixed.pdf', await pdfDoc.save());
}

async function run() {
  await createTestPDF();
  await fixTestPDF();
  console.log('Done');
}
run();
