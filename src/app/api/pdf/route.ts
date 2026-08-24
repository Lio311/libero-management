import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const store = searchParams.get('store');

  if (!orderId || !store) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // Get lionwheel API key based on store (assuming libero is the default/only one with Lionwheel)
  const apiKey = process.env.LIONWHEEL_API_KEY;
  if (!apiKey) {
    return new NextResponse('Lionwheel API key not configured', { status: 500 });
  }

  try {
    const res = await fetch(`https://backend.lionwheel.com/api/v1/orders/label?order_ids=\${orderId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer \${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return new NextResponse(`Lionwheel returned \${res.status}`, { status: res.status });
    }

    const pdfBuffer = await res.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="shipping_label_\${orderId}.pdf"`
      }
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
