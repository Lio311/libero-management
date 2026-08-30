import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedShippingLabels } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  try {
    const res = await db.select().from(generatedShippingLabels).where(like(generatedShippingLabels.barcode, `%${code}%`));
    return NextResponse.json({ success: true, count: res.length, data: res });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
