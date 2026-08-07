import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wcProducts, wcOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const LIBERO_CONFIG = {
  ck: '[REDACTED_CK]',
  cs: '[REDACTED_CS]',
  baseUrl: 'https://libero-il.co.il',
};

async function fetchFromWooCommerce(endpoint: string, queryParams: string = '') {
  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  let allData: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 50) { // Safety limit
    const url = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/${endpoint}?per_page=100&page=${page}${queryParams ? `&${queryParams}` : ''}`;
    console.log(`Fetching: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`WooCommerce API error: ${response.status}`);
      break;
    }

    const data = await response.json();
    allData = allData.concat(data);

    if (data.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allData;
}

export async function GET(request: Request) {
  // Check auth for cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const isManual = url.searchParams.get('manual') === 'true';

  if (cronSecret && !isManual && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = url.searchParams.get('mode') || 'incremental';
  let queryParams = '';

  if (mode === 'incremental') {
    // 7 days ago
    const afterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    queryParams = `after=${afterDate}`;
  } else if (mode === 'modified') {
    const afterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    queryParams = `modified_after=${afterDate}`;
  } else if (mode === 'full') {
    const afterDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
    queryParams = `after=${afterDate}`;
  }

  try {
    // 1. Fetch & Sync Products
    const products = await fetchFromWooCommerce('products', queryParams + '&status=any&_fields=id,name,sku,price,stock_quantity,date_created,categories,status');
    let productsAdded = 0;
    let productsUpdated = 0;

    for (const p of products) {
      const existing = await db.select().from(wcProducts).where(eq(wcProducts.id, p.id)).limit(1);
      
      const insertData = {
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        price: p.price ? p.price.toString() : '0',
        stockQuantity: p.stock_quantity || 0,
        dateCreated: p.date_created ? new Date(p.date_created) : new Date(),
        status: p.status || 'publish',
        categories: p.categories || [],
        updatedAt: new Date(),
      };

      if (existing.length === 0) {
        await db.insert(wcProducts).values(insertData);
        productsAdded++;
      } else {
        await db.update(wcProducts).set(insertData).where(eq(wcProducts.id, p.id));
        productsUpdated++;
      }
    }

    // 2. Fetch & Sync Orders
    const orders = await fetchFromWooCommerce('orders', queryParams + '&status=processing,completed&_fields=id,total,date_created,line_items,customer_id,status,billing');
    let ordersAdded = 0;
    let ordersUpdated = 0;

    for (const o of orders) {
      const existing = await db.select().from(wcOrders).where(eq(wcOrders.id, o.id)).limit(1);
      
      const insertData = {
        id: o.id,
        total: o.total ? o.total.toString() : '0',
        customerId: o.customer_id || 0,
        dateCreated: o.date_created ? new Date(o.date_created) : new Date(),
        status: o.status || 'processing',
        lineItems: o.line_items || [],
        billing: o.billing || null,
        updatedAt: new Date(),
      };

      if (existing.length === 0) {
        await db.insert(wcOrders).values(insertData);
        ordersAdded++;
      } else {
        await db.update(wcOrders).set(insertData).where(eq(wcOrders.id, o.id));
        ordersUpdated++;
      }
    }

    return NextResponse.json({
      success: true,
      mode,
      products: {
        added: productsAdded,
        updated: productsUpdated,
        totalFetched: products.length,
      },
      orders: {
        added: ordersAdded,
        updated: ordersUpdated,
        totalFetched: orders.length,
      }
    });

  } catch (error: any) {
    console.error('WC Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync WC data' },
      { status: 500 }
    );
  }
}
