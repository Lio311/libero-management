require('dotenv').config({ path: '.env.local' });
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

async function check() {
  const brands = ['velour', 'libero', 'labura'];
  const results = {};
  
  for (const brand of brands) {
    const api = new WooCommerceRestApi({
      url: process.env[`WC_URL_${brand.toUpperCase()}`],
      consumerKey: process.env[`WC_KEY_${brand.toUpperCase()}`],
      consumerSecret: process.env[`WC_SECRET_${brand.toUpperCase()}`],
      version: "wc/v3"
    });
    
    try {
      const response = await api.get("coupons", { search: "yahav10" });
      console.log(`yahav10 in ${brand}: ${response.data.length > 0 ? 'YES' : 'NO'}`);
      
      const res2 = await api.get("coupons", { search: "laty10" });
      console.log(`laty10 in ${brand}: ${res2.data.length > 0 ? 'YES' : 'NO'}`);
      
      const res3 = await api.get("coupons", { search: "laty2" });
      console.log(`laty2 in ${brand}: ${res3.data.length > 0 ? 'YES' : 'NO'}`);
    } catch (e) {
      console.log(`Error checking ${brand}: ${e.message}`);
    }
  }
}
check();
