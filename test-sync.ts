import { BRAND_CONFIG } from './src/lib/wc-config';

async function fetchFromWooCommerce(endpoint: string, queryParams: string = '', store: 'libero' | 'velour' | 'labura' = 'libero') {
  const config = BRAND_CONFIG[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
  
  const firstUrl = `${config.baseUrl}/wp-json/wc/v3/${endpoint}?per_page=1&page=1${queryParams ? `&${queryParams}` : ''}`;
  console.log(`Fetching: ${firstUrl}`);
  const firstRes = await fetch(firstUrl, {
    method: 'GET',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
  });

  if (!firstRes.ok) {
    throw new Error(`WooCommerce API error: ${firstRes.status} ${await firstRes.text()}`);
  }
  return await firstRes.json();
}

async function run() {
  try {
    const products = await fetchFromWooCommerce('products', '', 'velour');
    console.log("Velour product 1 fetched successfully.");
  } catch (e) {
    console.error("Error fetching velour products:", e);
  }
  try {
    const products = await fetchFromWooCommerce('products', '', 'labura');
    console.log("Labura product 1 fetched successfully.");
  } catch (e) {
    console.error("Error fetching labura products:", e);
  }
}
run();
