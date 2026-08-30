import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path'); // e.g. /tasks
  
  if (!path) return NextResponse.json({ error: 'path required' });

  // pass all other search parameters
  const newParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'path') {
      newParams.append(key, value);
    }
  });
  newParams.append('key', LIONWHEEL_API_KEY);

  try {
    const res = await fetch(`https://members.lionwheel.com/api/v1${path}?${newParams.toString()}`);
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
