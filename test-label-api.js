const fs = require('fs');
require('dotenv').config({ path: '.env.production.local' });

async function run() {
  const orderId = '55199'; // From DB job 814 (store: libero)
  const apiKey = process.env.LIONWHEEL_API_KEY.replace(/['"]/g, '').trim();
  
  const res = await fetch(`https://backend.lionwheel.com/api/v1/orders/label?order_ids=${orderId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });
  console.log('Status:', res.status);
  
  if (res.ok) {
    const buffer = await res.arrayBuffer();
    console.log('Got PDF! Length:', buffer.byteLength);
    fs.writeFileSync('test_label_api.pdf', Buffer.from(buffer));
  } else {
    console.log('Body:', await res.text());
  }
}
run();
