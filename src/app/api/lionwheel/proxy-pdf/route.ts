import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  let browser = null;

  try {
    console.log('[proxy-pdf] Launching headless browser for:', url);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: 'shell' as any,
    });

    const page = await browser.newPage();

    // Set desktop user agent so Lionwheel renders the label normally
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Before the page loads, inject interceptors:
    // 1. Suppress window.print() so the print dialog doesn't block
    // 2. Intercept URL.createObjectURL to capture the PDF blob that pdfMake generates
    await page.evaluateOnNewDocument(() => {
      const w = window as any;
      w.__pdfReady = false;
      w.__pdfBase64 = null;

      // Suppress print dialog
      w.print = function () {};

      // Intercept PDF blob creation
      const origCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (obj: any) {
        const blobUrl = origCreateObjectURL(obj);
        if (obj instanceof Blob && obj.type === 'application/pdf') {
          const reader = new FileReader();
          reader.onload = function () {
            w.__pdfBase64 = (reader.result as string).split(',')[1];
            w.__pdfReady = true;
          };
          reader.readAsDataURL(obj);
        }
        return blobUrl;
      };
    });

    // Navigate to the Lionwheel label page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 20000,
    });

    // Wait for the PDF blob to be captured (max 10 seconds)
    await page.waitForFunction('window.__pdfReady === true', {
      timeout: 10000,
    });

    // Extract the base64-encoded PDF
    const base64: string = await page.evaluate(() => (window as any).__pdfBase64);

    if (!base64) {
      throw new Error('Failed to capture PDF data');
    }

    console.log('[proxy-pdf] PDF captured successfully, size:', base64.length, 'chars');

    const pdfBuffer = Buffer.from(base64, 'base64');
    
    // Scale the PDF down slightly and center it to avoid any printer cutoff
    const { PDFDocument, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      if (width > height) {
        console.log('[proxy-pdf] Fixing landscape label to print horizontally on portrait paper');
        // The original PDF is Landscape (e.g. 150 wide, 100 high).
        // The printer uses 10x15 Portrait paper. If we leave it as Landscape, PDFtoPrinter will automatically rotate it 90 degrees,
        // causing it to print sideways and get cut off.
        // We must embed this Landscape content into a Portrait page (e.g. 100 wide, 150 high)
        // so it prints horizontally across the top of the paper, exactly like the store labels do.
        
        const targetWidth = height; // e.g. 100
        const targetHeight = width; // e.g. 150
        
        // Scale the content so its original width (150) fits into the new width (100) with a tiny 4% safety margin
        const scale = (targetWidth * 0.96) / width; 
        
        // Change the actual PDF page dimensions to Portrait
        page.setSize(targetWidth, targetHeight);
        
        // Scale the drawn content down
        page.scaleContent(scale, scale);
        
        // Center it horizontally
        const xOffset = (targetWidth - (width * scale)) / 2;
        
        // PDF coordinates start at (0,0) in the bottom-left. 
        // We want the content at the TOP of the new 150-tall page, with a tiny top margin
        const contentHeight = height * scale;
        const topMargin = targetHeight * 0.02; // 2% top margin
        const yOffset = targetHeight - contentHeight - topMargin;
        
        // Apply translation
        page.translateContent(xOffset, yOffset);
        
        // Draw tiny dots at the absolute corners so PDFtoPrinter doesn't auto-crop the blank space at the bottom!
        page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
        page.drawCircle({ x: targetWidth - 1, y: targetHeight - 1, size: 0.1, color: rgb(0,0,0) });
        
      } else {
        // If it's ALREADY a portrait label (e.g., from the store system), we might not need to do anything!
        // But just in case PDFtoPrinter auto-crops it, let's add the dots.
        page.drawCircle({ x: 1, y: 1, size: 0.1, color: rgb(0,0,0) });
        page.drawCircle({ x: width - 1, y: height - 1, size: 0.1, color: rgb(0,0,0) });
      }
    }
    const modifiedPdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(modifiedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="shipping-label.pdf"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[proxy-pdf] Error:', error?.message || error);
    // Fallback: redirect to original URL so the user still gets something
    return NextResponse.redirect(url);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
