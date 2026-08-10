require('dotenv').config({ path: '.env' });
const auth = Buffer.from(`[REDACTED_CK]:[REDACTED_CS]`).toString('base64');
const groups = ["חדירה זול", "חדירה יקר", "בסיס זול", "בסיס יקר", "פרימיום יקר", "פרימיום זול", "מותגי הבית"];

async function checkProducts() {
  let page = 1;
  let found = {};
  
  while(page <= 5) { // Check up to 500 products
    const res = await fetch(`https://libero-il.co.il/wp-json/wc/v3/products?per_page=100&page=${page}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const data = await res.json();
    if (!data || data.length === 0) break;
    
    for (let p of data) {
      let productStr = JSON.stringify(p);
      for (let g of groups) {
        if (productStr.includes(g)) {
          if (!found[g]) found[g] = [];
          if (found[g].length < 1) { // Just get the first match for debugging
             found[g].push(p);
          }
        }
      }
    }
    page++;
  }
  
  for (let g of Object.keys(found)) {
    console.log(`\n\n--- MATCH FOUND FOR: ${g} ---`);
    const match = found[g][0];
    
    // Find where it matched
    if (JSON.stringify(match.meta_data).includes(g)) {
       console.log('Found in meta_data:', JSON.stringify(match.meta_data.filter(m => JSON.stringify(m).includes(g)), null, 2));
    }
    if (JSON.stringify(match.attributes).includes(g)) {
       console.log('Found in attributes:', JSON.stringify(match.attributes.filter(m => JSON.stringify(m).includes(g)), null, 2));
    }
    if (JSON.stringify(match.categories).includes(g)) {
       console.log('Found in categories:', JSON.stringify(match.categories.filter(m => JSON.stringify(m).includes(g)), null, 2));
    }
    if (JSON.stringify(match.tags).includes(g)) {
       console.log('Found in tags:', JSON.stringify(match.tags.filter(m => JSON.stringify(m).includes(g)), null, 2));
    }
  }
}
checkProducts().catch(console.error);
