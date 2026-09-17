const fs = require('fs');

const path = 'src/app/api/lionwheel/proxy-pdf/route.ts';
let code = fs.readFileSync(path, 'utf8');

const oldTransform = `    // Shift the page content right by 15 points to avoid left cutoff
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      page.translateContent(15, 0);
    }`;

const newTransform = `    // Scale the PDF down slightly and center it to avoid any printer cutoff
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Scale down by 8% (0.92) to give it a safe margin all around
      const scale = 0.92;
      
      // Calculate how much to shift to keep it centered
      const xOffset = (width * (1 - scale)) / 2;
      const yOffset = (height * (1 - scale)) / 2;
      
      page.scaleContent(scale, scale);
      page.translateContent(xOffset, yOffset);
      
      // Also shift it slightly more to the right if the left barcode is still an issue
      // We'll add an extra 15 points to the right
      page.translateContent(20, 0);
    }`;

if (code.includes('page.translateContent(15, 0);')) {
  code = code.replace(oldTransform, newTransform);
  fs.writeFileSync(path, code);
  console.log('Fixed proxy-pdf route');
} else {
  console.log('Could not find old transform');
}
