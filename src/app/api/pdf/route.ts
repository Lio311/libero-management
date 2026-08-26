import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const store = searchParams.get('store');

  if (!orderId || !store) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  const defaultKey = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
  const velourKey = (process.env.LIONWHEEL_API_KEY_velour || "").replace(/['"]/g, '').trim() || defaultKey;
  const laburaKey = (process.env.LIONWHEEL_API_KEY_labura || "").replace(/['"]/g, '').trim() || defaultKey;
  
  let apiKey = defaultKey;
  if (store === "velour") apiKey = velourKey;
  if (store === "labura") apiKey = laburaKey;

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
