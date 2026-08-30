import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedShippingLabels } from '@/lib/db/schema';

export async function GET() {
  try {
    const labels = await db.select().from(generatedShippingLabels);
    let fixedCount = 0;
    
    for (const label of labels) {
      if (label.orderId && label.orderId.includes('-')) {
        const realId = label.orderId.split('-')[0];
        // Only update if it looks like a number
        if (/^\d+$/.test(realId)) {
          const { eq } = await import('drizzle-orm');
          await db.update(generatedShippingLabels)
            .set({ orderId: realId })
            .where(eq(generatedShippingLabels.id, label.id));
          fixedCount++;
        }
      }
    }
    
    return NextResponse.json({ success: true, fixedCount, totalLabels: labels.length });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
