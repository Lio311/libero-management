
const LIBERO_CONFIG = {
  ck: 'ck_c551947f6cd4c709b527cab0f18651cf19433b51',
  cs: 'cs_c32883b9954569200ebea224812180dad9cc01dc',
  baseUrl: 'https://libero-il.co.il',
};

async function checkWC() {
  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  
  // 1. Get total orders without date filter
  const urlTotal = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/orders?per_page=1&status=processing,completed`;
  const resTotal = await fetch(urlTotal, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  
  console.log('Total Orders Header:', resTotal.headers.get('x-wp-total'));
  console.log('Total Pages Header:', resTotal.headers.get('x-wp-totalpages'));

  // 2. Try to fetch the very oldest order
  const urlOldest = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/orders?per_page=1&order=asc&orderby=date&status=processing,completed`;
  const resOldest = await fetch(urlOldest, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  const dataOldest = await resOldest.json();
  if (dataOldest.length > 0) {
    console.log('Oldest Order Date:', dataOldest[0].date_created);
    console.log('Oldest Order ID:', dataOldest[0].id);
  } else {
    console.log('No orders found with asc sorting');
  }
}

checkWC();
