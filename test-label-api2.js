const fs = require('fs');
require('dotenv').config({ path: '.env.production.local' });

async function run() {
  const orderId = '55199'; 
  const apiKey = process.env.LIONWHEEL_API_KEY.replace(/['"]/g, '').trim();
  
  const urls = [
    `https://members.lionwheel.com/api/v1/orders/label?order_ids=${orderId}`,
    `https://members.lionwheel.com/api/v1/tasks/label?order_ids=${orderId}`,
    `https://members.lionwheel.com/api/v1/tasks/label?id=${orderId}`
  ];
  
  for (const url of urls) {
    const res = await fetch(url, { headers: { "Authorization": `Bearer ${apiKey}` } });
    console.log(`URL: ${url} -> Status: ${res.status}`);
  }
}
run();
