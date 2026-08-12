/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
 
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

try {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    publicKey,
    privateKey
  );
} catch (e) {
  console.error("Failed to set VAPID details", e);
}

export async function POST(req: Request) {
  // Verify webhook authorization
  const authHeader = req.headers.get('authorization');
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await req.json();

    const subscriptions = await db.select().from(pushSubscriptions);
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title: 'עדכון מערכת',
      body: message,
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
        console.error('Error sending push to endpoint:', sub.endpoint, err);
        // Optionally delete invalid subscriptions here
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
