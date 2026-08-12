const https = require('https');
https.get('https://mist.co.il/collections/back-in-stock/products.json?limit=250', { headers: { 'User-Agent': 'MistMonitor/1.0' } }, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const fs = require('fs');
      let md = '# MIST Back In Stock Products\n\n';
      md += `Found ${json.products.length} products on the first page.\n\n`;
      json.products.forEach((p, i) => {
        md += `${i+1}. **${p.title}**\n`;
      });
      fs.writeFileSync('/Users/liorzafrir/.gemini/antigravity/brain/d5625577-4f2d-4252-bad9-84b9df830fc9/mist_products.md', md);
      console.log('Saved to mist_products.md');
    } catch(e) {
      console.error('Error parsing:', e.message);
    }
  });
}).on('error', e => console.error(e));
