import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/db';
import { wcOrders, velourOrders, laburaOrders } from '@/lib/db/schema';
import { BRAND_CONFIG, type Brand } from '@/lib/wc-config';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function getOrdersTable(store: Brand) {
  if (store === 'velour') return velourOrders;
  if (store === 'labura') return laburaOrders;
  return wcOrders;
}

function identifyStoreFromSource(source: string): Brand | null {
  for (const [brand, config] of Object.entries(BRAND_CONFIG)) {
    if (source.includes(new URL(config.baseUrl).hostname)) {
      return brand as Brand;
    }
  }
  return null;
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const hash = createHmac('sha256', secret).update(body, 'utf8').digest('base64');
  return hash === signature;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const storeParam = url.searchParams.get('store') as Brand | null;

  // Read the raw body for signature verification
  const rawBody = await request.text();

  // Verify HMAC signature
  const signature = request.headers.get('x-wc-webhook-signature');
  const webhookSecret = process.env.WC_WEBHOOK_SECRET;

  if (webhookSecret && signature) {
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('[WC Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // WooCommerce sends a ping on webhook creation — just acknowledge it
  const topic = request.headers.get('x-wc-webhook-topic');
  if (!topic) {
    // Likely a ping or test
    return NextResponse.json({ success: true, message: 'pong' });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error('[WC Webhook] Invalid JSON payload');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Determine the store — from query param or from the payload source URL
  let store: Brand = storeParam || 'libero';
  if (!storeParam && payload._links?.self?.[0]?.href) {
    const detected = identifyStoreFromSource(payload._links.self[0].href);
    if (detected) store = detected;
  }

  const ordersTable = getOrdersTable(store);

  try {
    if (topic === 'order.deleted') {
      // Delete the order from local DB
      if (payload.id) {
        await db.delete(ordersTable).where(eq(ordersTable.id, payload.id));
        console.log(`[WC Webhook] Deleted order ${payload.id} from ${store}`);
      }
      return NextResponse.json({ success: true, action: 'deleted' });
    }

    // For order.created and order.updated — upsert the order
    if (topic === 'order.created' || topic === 'order.updated') {
      if (!payload.id) {
        return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
      }

      const orderData = {
        id: payload.id,
        total: payload.total ? payload.total.toString() : '0',
        customerId: payload.customer_id || 0,
        dateCreated: payload.date_created_gmt
          ? new Date(payload.date_created_gmt + 'Z')
          : new Date(),
        status: payload.status || 'processing',
        lineItems: payload.line_items || [],
        shippingLines: payload.shipping_lines || [],
        billing: payload.billing || null,
        updatedAt: payload.date_modified_gmt
          ? new Date(payload.date_modified_gmt + 'Z')
          : new Date(),
      };

      await db.insert(ordersTable).values(orderData).onConflictDoUpdate({
        target: ordersTable.id,
        set: {
          total: sql`EXCLUDED.total`,
          customerId: sql`EXCLUDED.customer_id`,
          dateCreated: sql`EXCLUDED.date_created`,
          status: sql`EXCLUDED.status`,
          lineItems: sql`EXCLUDED.line_items`,
          shippingLines: sql`EXCLUDED.shipping_lines`,
          billing: sql`EXCLUDED.billing`,
          updatedAt: sql`EXCLUDED.updated_at`,
        },
      });

      console.log(`[WC Webhook] Upserted order ${payload.id} (${payload.status}) for ${store}`);
      return NextResponse.json({ success: true, action: topic, orderId: payload.id });
    }

    // Unknown topic — just acknowledge
    console.log(`[WC Webhook] Unknown topic: ${topic}`);
    return NextResponse.json({ success: true, message: `Unhandled topic: ${topic}` });
  } catch (error: any) {
    console.error('[WC Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
