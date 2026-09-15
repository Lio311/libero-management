export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const { base64 } = await request.json();
    if (!base64) {
      return new NextResponse('Missing base64 parameter', { status: 400 });
    }

    const pdfBuffer = Buffer.from(base64, 'base64');
    const origDoc = await PDFDocument.load(pdfBuffer);
    const newDoc = await PDFDocument.create();
    
    const embeddedPages = await newDoc.embedPdf(pdfBuffer);
    
    for (let i = 0; i < embeddedPages.length; i++) {
      const origPage = origDoc.getPages()[i];
      const { width, height } = origPage.getSize();
      
      const newPage = newDoc.addPage([width, height]);
      const embeddedPage = embeddedPages[i];
      
      const scale = 0.82;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      // Shift right by 40 points to prevent left cutoff
      const x = ((width - scaledWidth) / 2) + 40;
      const y = (height - scaledHeight) / 2;
      
      newPage.drawPage(embeddedPage, {
        x,
        y,
        xScale: scale,
        yScale: scale,
      });
    }
    
    const fixedPdfBase64 = await newDoc.saveAsBase64();

    return NextResponse.json({ success: true, base64: fixedPdfBase64 });
  } catch (error: any) {
    console.error('Error cropping PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
