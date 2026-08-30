import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
  
  if (!LIONWHEEL_API_KEY) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://members.lionwheel.com/api/v1/tasks/by_phone/${encodeURIComponent(phone)}?key=${LIONWHEEL_API_KEY}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
