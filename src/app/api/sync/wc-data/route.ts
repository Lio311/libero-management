import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { BRAND_CONFIG } from '@/lib/wc-config';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { wcProducts, wcOrders, velourProducts, velourOrders, qcProducts, priceHistory } from '@/lib/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';



async function fetchFromWooCommerce(endpoint: string, queryParams: string = '', store: 'libero' | 'velour' = 'libero') {
  const config = BRAND_CONFIG[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
  
  let allData: any[] = [];
  
  const firstUrl = `${config.baseUrl}/wp-json/wc/v3/${endpoint}?per_page=100&page=1${queryParams ? `&${queryParams}` : ''}`;
  console.log(`Fetching: ${firstUrl}`);
  const firstRes = await fetch(firstUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!firstRes.ok) {
    console.error(`WooCommerce API error: ${firstRes.status}`);
    return [];
  }

  const totalPages = parseInt(firstRes.headers.get('x-wp-totalpages') || '1', 10);
  const firstData = await firstRes.json();
  allData = allData.concat(firstData);

  const pagesToFetch = Math.min(totalPages, 150); // limit to 15,000 items max

  const fetchPage = async (p: number) => {
    const url = `${config.baseUrl}/wp-json/wc/v3/${endpoint}?per_page=100&page=${p}${queryParams ? `&${queryParams}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    return res.json();
  };

  // Fetch remaining pages in batches of 10
  const batchSize = 10;
  for (let i = 2; i <= pagesToFetch; i += batchSize) {
    const promises = [];
    for (let j = i; j < i + batchSize && j <= pagesToFetch; j++) {
      promises.push(fetchPage(j));
    }
    console.log(`Fetching pages ${i} to ${Math.min(i + batchSize - 1, pagesToFetch)} for ${endpoint}...`);
    const results = await Promise.all(promises);
    for (const data of results) {
      allData = allData.concat(data);
    }
  }

  return allData;
}

export async function GET(request: Request) {
  // Check auth: allow if CRON_SECRET matches OR if a valid JWT cookie is present
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  let isAuthorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true;
  } else {
    try {
      const { userId } = await auth();
      if (userId) {
        isAuthorized = true;
      }
    } catch (e) {
      console.error('Clerk auth failed in sync route:', e);
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'incremental';
  const store = (url.searchParams.get('store') as 'libero' | 'velour') || 'libero';

  const targetProductsTable = store === 'velour' ? velourProducts : wcProducts;
  const targetOrdersTable = store === 'velour' ? velourOrders : wcOrders;
  let queryParams = '';

  if (mode === 'incremental') {
    // 7 days ago
    const afterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    queryParams = `modified_after=${afterDate}`;
  } else if (mode === 'modified') {
    const afterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    queryParams = `modified_after=${afterDate}`;
  } else if (mode === 'full') {
    const afterDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
    queryParams = `after=${afterDate}`;
  }

  try {
    // Helper for chunking arrays
    const chunkArray = <T>(array: T[], size: number): T[][] => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    // 1. Fetch & Sync Products
    const products = await fetchFromWooCommerce('products', queryParams + '&status=any&_fields=id,name,sku,price,stock_quantity,date_created,date_modified,categories,status', store);
    
    if (products.length > 0) {
      const existingProducts = await db.select({ id: targetProductsTable.id, stockQuantity: targetProductsTable.stockQuantity, price: targetProductsTable.price, name: targetProductsTable.name }).from(targetProductsTable);
      const stockMap = new Map(existingProducts.map(p => [p.id, p.stockQuantity || 0]));
      const priceMap = new Map(existingProducts.map(p => [p.id, p.price || '0']));
      const nameMap = new Map(existingProducts.map(p => [p.id, p.name]));
      const restockedProductIds: number[] = [];
      const priceChanges: { wooProductId: number; productName: string; oldPrice: string; newPrice: string }[] = [];

      const productValues = products.map((p: any) => {
        const id = p.id;
        const newStock = p.stock_quantity || 0;
        const oldStock = stockMap.get(id) || 0;
        
        // If stock goes up and it's not a newly added product, it's a restock.
        if (newStock > oldStock && stockMap.has(id)) {
          restockedProductIds.push(id);
        }

        // Detect price changes
        const newPrice = p.price ? p.price.toString() : '0';
        const oldPrice = priceMap.get(id) || '0';
        if (priceMap.has(id) && newPrice !== oldPrice) {
          priceChanges.push({
            wooProductId: id,
            productName: nameMap.get(id) || p.name || '',
            oldPrice,
            newPrice,
          });
        }

        return {
          id,
          name: p.name,
          sku: p.sku || '',
          price: p.price ? p.price.toString() : '0',
          stockQuantity: newStock,
          dateCreated: p.date_created ? new Date(p.date_created) : new Date(),
          status: p.status || 'publish',
          categories: p.categories || [],
          updatedAt: p.date_modified ? new Date(p.date_modified) : new Date(),
        };
      });

      const productChunks = chunkArray(productValues, 500);
      for (const chunk of productChunks) {
        await db.insert(targetProductsTable).values(chunk)
          .onConflictDoUpdate({
            target: targetProductsTable.id,
            set: {
              name: sql`EXCLUDED.name`,
              sku: sql`EXCLUDED.sku`,
              price: sql`EXCLUDED.price`,
              stockQuantity: sql`EXCLUDED.stock_quantity`,
              dateCreated: sql`EXCLUDED.date_created`,
              status: sql`EXCLUDED.status`,
              categories: sql`EXCLUDED.categories`,
              updatedAt: sql`EXCLUDED.updated_at`,
            }
          });
      }

      if (store === 'libero' && restockedProductIds.length > 0) {
        // Update qcProducts with the new restock date
        const restockChunks = chunkArray(restockedProductIds, 500);
        for (const chunk of restockChunks) {
          await db.update(qcProducts)
            .set({ lastRestockDate: new Date(), updatedAt: new Date() })
            .where(inArray(qcProducts.wooProductId, chunk));
        }
      }

      // Save price changes to history
      if (store === 'libero' && priceChanges.length > 0) {
        const priceHistoryValues = priceChanges.map(pc => ({
          wooProductId: pc.wooProductId,
          productName: pc.productName,
          oldPrice: pc.oldPrice,
          newPrice: pc.newPrice,
          changedAt: new Date(),
        }));
        const priceChunks = chunkArray(priceHistoryValues, 500);
        for (const chunk of priceChunks) {
          await db.insert(priceHistory).values(chunk);
        }
      }
    }

    // 2. Fetch & Sync Orders
    const orders = await fetchFromWooCommerce('orders', queryParams + '&status=processing,completed&_fields=id,total,date_created,line_items,shipping_lines,customer_id,status,billing', store);
    
    if (orders.length > 0) {
      const orderValues = orders.map((o: any) => ({
        id: o.id,
        total: o.total ? o.total.toString() : '0',
        customerId: o.customer_id || 0,
        dateCreated: o.date_created ? new Date(o.date_created) : new Date(),
        status: o.status || 'processing',
        lineItems: o.line_items || [],
        shippingLines: o.shipping_lines || [],
        billing: o.billing || null,
        updatedAt: new Date(),
      }));

      const orderChunks = chunkArray(orderValues, 500);
      for (const chunk of orderChunks) {
        await db.insert(targetOrdersTable).values(chunk)
          .onConflictDoUpdate({
            target: targetOrdersTable.id,
            set: {
              total: sql`EXCLUDED.total`,
              customerId: sql`EXCLUDED.customer_id`,
              dateCreated: sql`EXCLUDED.date_created`,
              status: sql`EXCLUDED.status`,
              lineItems: sql`EXCLUDED.line_items`,
              shippingLines: sql`EXCLUDED.shipping_lines`,
              billing: sql`EXCLUDED.billing`,
              updatedAt: sql`EXCLUDED.updated_at`,
            }
          });
      }
    }

    return NextResponse.json({
      success: true,
      mode,
      products: {
        totalFetched: products.length,
        upserted: products.length,
      },
      orders: {
        totalFetched: orders.length,
        upserted: orders.length,
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
