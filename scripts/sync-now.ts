import { db } from '../src/lib/db/index';
import { qcProducts } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

const LIBERO_CONFIG = {
  ck: process.env.LIBERO_WC_CK || '',
  cs: process.env.LIBERO_WC_CS || '',
  baseUrl: 'https://libero-il.co.il',
};

async function fetchAllProducts() {
  console.log("Fetching first page...");
  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  let allProducts: any[] = [];

  const firstPageUrl = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/products?per_page=100&page=1&status=publish&_fields=id,name,sku,images,date_created`;
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
  console.log(`Total Pages: ${totalPages}`);

  const fetchPage = async (p: number) => {
    const url = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/products?per_page=100&page=${p}&status=publish&_fields=id,name,sku,images,date_created`;
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
    if (promises.length === 5 || i === totalPages) {
      console.log(`Fetching pages chunk ending at ${i}...`);
      const results = await Promise.all(promises);
      results.forEach((res) => {
        allProducts = allProducts.concat(res);
      });
      promises = [];
    }
  }

  return allProducts;
}

async function run() {
  console.log("Starting sync...");
  const wooProducts = await fetchAllProducts();
  console.log(`Fetched ${wooProducts.length} products from WooCommerce.`);

  if (wooProducts.length === 0) {
    console.log("No products fetched.");
    process.exit(0);
  }

  const chunkSize = 500;
  for (let i = 0; i < wooProducts.length; i += chunkSize) {
    const batch = wooProducts.slice(i, i + chunkSize);
    console.log(`Inserting batch ${i} to ${i + batch.length}...`);
    
    const valuesToInsert = batch.map((product: any) => {
      const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : null;
      return {
        wooProductId: product.id,
        productName: product.name,
        productSku: product.sku || null,
        productImage: imageUrl,
        dateAddedToSite: product.date_created ? new Date(product.date_created) : new Date(),
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
            dateAddedToSite: sql`EXCLUDED.date_added_to_site`,
            updatedAt: sql`EXCLUDED.updated_at`,
          }
        });
    }
  }

  console.log("Sync complete!");
  process.exit(0);
}

run().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
