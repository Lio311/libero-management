const LIBERO_CONFIG = {
  ck: '[REDACTED_CK]',
  cs: '[REDACTED_CS]',
  baseUrl: 'https://libero-il.co.il',
};

async function checkWC() {
  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  
  const afterDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
  
  const urlTotal = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/orders?per_page=1&status=processing,completed&after=${afterDate}`;
  const resTotal = await fetch(urlTotal, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  
  console.log(`Querying after: ${afterDate}`);
  console.log('Total Orders Header:', resTotal.headers.get('x-wp-total'));
  console.log('Total Pages Header:', resTotal.headers.get('x-wp-totalpages'));
}

checkWC();
