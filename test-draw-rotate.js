const { PDFDocument, rgb, degrees } = require('pdf-lib');
async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([150, 100]); // landscape
  
  let { width, height } = page.getSize(); // 150, 100
  if (width > height) {
    page.setRotation(degrees(90));
    // Do NOT swap width and height for drawing!
    // But for scaling and centering, what is the right logic?
  }
  
  // if we scale and translate, it affects the UNROTATED coordinates!
  const scale = 0.90;
  const xOffset = (width * (1 - scale)) / 2;
  const yOffset = (height * (1 - scale)) / 2;
  page.scaleContent(scale, scale);
  page.translateContent(xOffset, yOffset);
  
  // draw dots in unrotated coordinates
  page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
  page.drawCircle({ x: width - 1, y: height - 1, size: 0.1, color: rgb(0,0,0) });

  console.log('Done');
}
run();
