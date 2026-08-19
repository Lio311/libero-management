import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    console.log("Fetching PDF from:", url);
    const pdfReq = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/json,text/html,*/*'
      }
    });
    if (!pdfReq.ok) {
      console.warn("Failed to fetch PDF via proxy, redirecting to original url. Status:", pdfReq.status);
      return NextResponse.redirect(url);
    }

    const arrayBuffer = await pdfReq.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="shipping-label.pdf"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('PDF proxy error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
