require('dotenv').config({ path: '.env.local' });

async function check() {
  const brands = ['velour', 'libero', 'labura'];
  
  for (const brand of brands) {
    const url = process.env[`WC_URL_${brand.toUpperCase()}`];
    const key = process.env[`WC_KEY_${brand.toUpperCase()}`];
    const secret = process.env[`WC_SECRET_${brand.toUpperCase()}`];
    
    if (!url || !key || !secret) {
        console.log(`Missing credentials for ${brand}`);
        continue;
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    
    try {
      const res1 = await fetch(`${url}/wp-json/wc/v3/coupons?search=yahav10`, { headers: { Authorization: `Basic ${auth}` }});
      const data1 = await res1.json();
      console.log(`yahav10 in ${brand}: ${data1.length > 0 ? 'YES' : 'NO'}`);
      
      const res2 = await fetch(`${url}/wp-json/wc/v3/coupons?search=laty10`, { headers: { Authorization: `Basic ${auth}` }});
      const data2 = await res2.json();
      console.log(`laty10 in ${brand}: ${data2.length > 0 ? 'YES' : 'NO'}`);
      
      const res3 = await fetch(`${url}/wp-json/wc/v3/coupons?search=laty2`, { headers: { Authorization: `Basic ${auth}` }});
      const data3 = await res3.json();
      console.log(`laty2 in ${brand}: ${data3.length > 0 ? 'YES' : 'NO'}`);
    } catch (e) {
      console.log(`Error checking ${brand}: ${e.message}`);
    }
  }
}
check();
