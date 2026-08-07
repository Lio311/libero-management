import { db } from './src/lib/db/index';
import { wcOrders, wcProducts } from './src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function testWcOrders() {
  const LIBERO_CONFIG = {
    ck: 'ck_c551947f6cd4c709b527cab0f18651cf19433b51',
    cs: 'cs_c32883b9954569200ebea224812180dad9cc01dc',
    baseUrl: 'https://libero-il.co.il',
  };

  const auth = Buffer.from(`${LIBERO_CONFIG.ck}:${LIBERO_CONFIG.cs}`).toString('base64');
  
  const url = `${LIBERO_CONFIG.baseUrl}/wp-json/wc/v3/orders?per_page=1&_fields=id,total,date_created,line_items,customer_id,status,billing`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log("Order Data:", JSON.stringify(data, null, 2));
}

testWcOrders().catch(console.error);
