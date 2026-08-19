import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const pdfReq = await fetch(url);
    if (!pdfReq.ok) {
      return new NextResponse('Failed to fetch PDF', { status: pdfReq.status });
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
