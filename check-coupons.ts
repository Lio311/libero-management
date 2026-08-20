import { BRAND_CONFIG } from './src/lib/wc-config';

async function checkCoupons() {
  for (const brand of ['libero', 'velour', 'labura']) {
    const config = BRAND_CONFIG[brand as keyof typeof BRAND_CONFIG];
    if (!config || !config.ck) {
      console.log(`No credentials for ${brand}`);
      continue;
    }
    const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
    const url = `${config.baseUrl}/wp-json/wc/v3/coupons?code=efrat10`;
    
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`Found efrat10 in ${brand}! ID: ${data[0].id}`);
      } else {
        console.log(`Not found in ${brand}`);
      }
    } catch (e: any) {
      console.log(`Error checking ${brand}: ${e.message}`);
    }
  }
}

checkCoupons();
