const fs = require('fs');
const path = 'src/app/api/lionwheel/proxy-pdf/route.ts';
let code = fs.readFileSync(path, 'utf8');

const oldTransform = `    // Scale the PDF down slightly and center it to avoid any printer cutoff
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

const newTransform = `    // Scale the PDF down slightly and center it to avoid any printer cutoff
    const { PDFDocument, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Scale down by 10% (0.90) to give it a safe margin all around
      const scale = 0.90;
      
      // Calculate how much to shift to keep it centered
      const xOffset = (width * (1 - scale)) / 2;
      const yOffset = (height * (1 - scale)) / 2;
      
      page.scaleContent(scale, scale);
      page.translateContent(xOffset, yOffset);
      
      // Also shift it slightly more to the right if the left barcode is still an issue
      // We'll add an extra 25 points to the right
      page.translateContent(25, 0);

      // CRITICAL FIX: PDFtoPrinter.exe auto-crops empty space! 
      // To prevent it from cropping the new margins we just created, 
      // we draw tiny nearly invisible dots at the extreme corners of the page.
      // This forces the bounding box of the content to be the full page size.
      page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
      page.drawCircle({ x: width - 1, y: height - 1, size: 0.1, color: rgb(0,0,0) });
    }`;

if (code.includes('const { PDFDocument } = await import(\'pdf-lib\');')) {
  code = code.replace(oldTransform, newTransform);
  fs.writeFileSync(path, code);
  console.log('Fixed proxy-pdf route with dots');
} else {
  console.log('Could not find old transform');
}
