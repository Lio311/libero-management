
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
  const url = new URL(request.url);
  const barcode = url.searchParams.get("barcode");
  const path = url.searchParams.get("path") || `tasks/by_barcode/${barcode}`;
  
  try {
    const res = await fetch(`https://members.lionwheel.com/api/v1/${path}?key=${LIONWHEEL_API_KEY}`);
    if(res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: res.status, text: await res.text() });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
