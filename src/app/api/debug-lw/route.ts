import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path'); // e.g. /tasks/1234
  
  if (!path) return NextResponse.json({ error: 'path required' });

  try {
    const res = await fetch(`https://members.lionwheel.com/api/v1${path}?key=${LIONWHEEL_API_KEY}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return NextResponse.json({ status: res.status, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
