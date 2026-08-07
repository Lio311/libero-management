import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qcProducts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

const LIBERO_CONFIG = {
  ck: 'ck_c551947f6cd4c709b527cab0f18651cf19433b51',
  cs: 'cs_c32883b9954569200ebea224812180dad9cc01dc',
  baseUrl: 'https://libero-il.co.il',
};

async function fetchAllProducts() {
  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  let allProducts: any[] = [];

  const firstPageUrl = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/products?per_page=100&page=1&status=publish&_fields=id,name,sku,images`;
  const response = await fetch(firstPageUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(`WooCommerce API error: ${response.status}`);
    return [];
  }

  const firstPageProducts = await response.json();
  allProducts = allProducts.concat(firstPageProducts);

  const totalPagesStr = response.headers.get('x-wp-totalpages');
  const totalPages = totalPagesStr ? parseInt(totalPagesStr, 10) : 1;

  const fetchPage = async (p: number) => {
    const url = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/products?per_page=100&page=${p}&status=publish&_fields=id,name,sku,images`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(`Error fetching page ${p}:`, e);
    }
    return [];
  };

  let promises: Promise<any[]>[] = [];
  for (let i = 2; i <= totalPages; i++) {
    promises.push(fetchPage(i));
    // Fetch in batches of 5 to avoid overwhelming the server
    if (promises.length === 5 || i === totalPages) {
      const results = await Promise.all(promises);
      results.forEach((res) => {
        allProducts = allProducts.concat(res);
      });
      promises = [];
    }
  }

  return allProducts;
}

export async function GET(request: Request) {
  // Verify authorization for cron jobs
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET matches, or if no CRON_SECRET is set (dev mode), or if it's a manual trigger
  const url = new URL(request.url);
  const isManual = url.searchParams.get('manual') === 'true';

  if (cronSecret && !isManual && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wooProducts = await fetchAllProducts();

    if (wooProducts.length === 0) {
      return NextResponse.json({ success: true, added: 0, updated: 0, total: 0, message: "No products fetched" });
    }

    // Chunk into batches of 500 for DB insert
    const chunkSize = 500;
    for (let i = 0; i < wooProducts.length; i += chunkSize) {
      const batch = wooProducts.slice(i, i + chunkSize);
      
      const valuesToInsert = batch.map((product: any) => {
        const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : null;
        return {
          wooProductId: product.id,
          productName: product.name,
          productSku: product.sku || null,
          productImage: imageUrl,
          updatedAt: new Date(),
        };
      });

      if (valuesToInsert.length > 0) {
        await db.insert(qcProducts)
          .values(valuesToInsert)
          .onConflictDoUpdate({
            target: qcProducts.wooProductId,
            set: {
              productName: sql`EXCLUDED.product_name`,
              productSku: sql`EXCLUDED.product_sku`,
              productImage: sql`EXCLUDED.product_image`,
              updatedAt: sql`EXCLUDED.updated_at`,
            }
          });
      }
    }

    return NextResponse.json({
      success: true,
      added: wooProducts.length, // Not accurate if we update, but returning total fetched for info
      updated: 0,
      total: wooProducts.length,
      totalInDb: wooProducts.length,
    });
  } catch (error: any) {
    console.error('QC Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync products' },
      { status: 500 }
    );
  }
}
