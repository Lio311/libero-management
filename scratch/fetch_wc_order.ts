import { BRAND_CONFIG } from '../src/lib/wc-config';

async function fetchOrder() {
  const config = BRAND_CONFIG['libero'];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
  const res = await fetch(`${config.baseUrl}/wp-json/wc/v3/orders?per_page=1`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  console.log(JSON.stringify(data[0], null, 2));
}

fetchOrder();
