import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qcProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const LIBERO_CONFIG = {
  ck: '[REDACTED_CK]',
  cs: '[REDACTED_CS]',
  baseUrl: 'https://libero-il.co.il',
};

async function fetchAllProducts() {
  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 20) {
    const url = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`;
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

    const products = await response.json();
    allProducts = allProducts.concat(products);

    if (products.length < 100) {
      hasMore = false;
    } else {
      page++;
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
    let addedCount = 0;
    let skippedCount = 0;

    for (const product of wooProducts) {
      // Check if product already exists
      const existing = await db
        .select()
        .from(qcProducts)
        .where(eq(qcProducts.wooProductId, product.id))
        .limit(1);

      if (existing.length === 0) {
        // Insert new product
        const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : null;
        await db.insert(qcProducts).values({
          wooProductId: product.id,
          productName: product.name,
          productSku: product.sku || null,
          productImage: imageUrl,
        });
        addedCount++;
      } else {
        // Update product name/image if changed
        const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : null;
        await db.update(qcProducts)
          .set({
            productName: product.name,
            productSku: product.sku || null,
            productImage: imageUrl,
            updatedAt: new Date(),
          })
          .where(eq(qcProducts.wooProductId, product.id));
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      added: addedCount,
      updated: skippedCount,
      total: wooProducts.length,
      totalInDb: addedCount + skippedCount,
    });
  } catch (error: any) {
    console.error('QC Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync products' },
      { status: 500 }
    );
  }
}
