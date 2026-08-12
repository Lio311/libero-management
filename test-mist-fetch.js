const https = require('https');
https.get('https://mist.co.il/collections/back-in-stock/products.json?limit=250', { headers: { 'User-Agent': 'MistMonitor/1.0' } }, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Fetched Mist:', json.products ? json.products.length : 0, 'products');
      if (json.products && json.products.length > 0) {
        console.log('First 5:', json.products.slice(0,5).map(p => p.title));
      }
    } catch(e) {
      console.error('Error parsing:', e.message);
    }
  });
}).on('error', e => console.error(e));
