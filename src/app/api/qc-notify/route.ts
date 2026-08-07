import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions, qcProducts, qcInspections } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const privateKey = process.env.VAPID_PRIVATE_KEY || '8XQx6e4Z1q9j9m3a7Y8n2C5t3R8f1D4w7E9b2G5v8Y8';

try {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    publicKey,
    privateKey
  );
} catch (e) {
  console.error("Failed to set VAPID details", e);
}

export async function GET(request: Request) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate pending QC count
    const products = await db.select().from(qcProducts);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let pendingCount = 0;
    for (const product of products) {
      const inspections = await db
        .select()
        .from(qcInspections)
        .where(eq(qcInspections.productId, product.id))
        .orderBy(desc(qcInspections.inspectedAt))
        .limit(1);

      if (inspections.length === 0 || inspections[0].inspectedAt < threeMonthsAgo) {
        pendingCount++;
      }
    }

    if (pendingCount === 0) {
      return NextResponse.json({ success: true, message: 'All products inspected, no notification sent' });
    }

    // Send push notification
    const subscriptions = await db.select().from(pushSubscriptions);

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No push subscriptions found' });
    }

    const payload = JSON.stringify({
      title: '📋 יום בקרת מוצרים',
      body: `היום יום שלישי — ${pendingCount} מוצרים ממתינים לבקרת איכות מתוך ${products.length} סה"כ.`,
    });

    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      };
      return webpush.sendNotification(pushSubscription, payload).catch(err => {
        console.error('Error sending QC push to endpoint:', sub.endpoint, err);
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      pendingCount,
      totalProducts: products.length,
      notificationsSent: subscriptions.length,
    });
  } catch (error: any) {
    console.error('QC notification cron error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
