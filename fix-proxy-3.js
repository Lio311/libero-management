const fs = require('fs');
const path = 'src/app/api/lionwheel/proxy-pdf/route.ts';
let code = fs.readFileSync(path, 'utf8');

const oldTransform = `    const pdfDoc = await PDFDocument.load(pdfBuffer);
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
      page.translateContent(10, 0);

      // CRITICAL FIX: PDFtoPrinter.exe auto-crops empty space! 
      // To prevent it from cropping the new margins we just created, 
      // we draw tiny nearly invisible dots at the extreme corners of the page.
      // This forces the bounding box of the content to be the full page size.
      page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
      page.drawCircle({ x: width - 1, y: height - 1, size: 0.1, color: rgb(0,0,0) });
    }`;

const newTransform = `    const { degrees } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      let { width, height } = page.getSize();
      
      // Fix wrong orientation (Landscape vs Portrait)
      // The store generates portrait labels, but scanner generates landscape labels for some reason.
      if (width > height) {
        console.log('[proxy-pdf] Rotating landscape label to portrait');
        // If it's landscape, rotate it by 90 degrees so it prints correctly on 10x15 paper
        page.setRotation(degrees(90));
        // Swap width and height for margin calculations
        const temp = width;
        width = height;
        height = temp;
      }
      
      // Scale down by 10% (0.90) to give it a safe margin all around
      const scale = 0.90;
      
      // Calculate how much to shift to keep it centered
      const xOffset = (width * (1 - scale)) / 2;
      const yOffset = (height * (1 - scale)) / 2;
      
      page.scaleContent(scale, scale);
      page.translateContent(xOffset, yOffset);
      
      // Also shift it slightly more to the right if the left barcode is still an issue
      page.translateContent(10, 0);

      // CRITICAL FIX: PDFtoPrinter.exe auto-crops empty space! 
      // To prevent it from cropping the new margins we just created, 
      // we draw tiny nearly invisible dots at the extreme corners of the page.
      // This forces the bounding box of the content to be the full page size.
      page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
      page.drawCircle({ x: width - 1, y: height - 1, size: 0.1, color: rgb(0,0,0) });
    }`;

if (code.includes('page.translateContent(10, 0);')) {
  // Re-read with pdf-lib degrees import
  const updatedCode = code.replace(oldTransform.replace('25, 0', '10, 0'), newTransform);
  fs.writeFileSync(path, updatedCode);
  console.log('Fixed proxy-pdf route with rotation check');
} else {
  console.log('Could not find old transform');
}
