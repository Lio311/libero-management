const auth = Buffer.from('ck_c551947f6cd4c709b527cab0f18651cf19433b51:cs_c32883b9954569200ebea224812180dad9cc01dc').toString('base64');
const baseUrl = "https://libero-il.co.il";

async function fetchAllProducts() {
  const start = Date.now();
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 20) {
    const url = `${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish&_fields=id,name,sku,images`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
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
  const end = Date.now();
  console.log(`Fetched ${allProducts.length} products in ${(end - start)/1000} seconds`);
}

fetchAllProducts();
