import { config } from 'dotenv';
config({ path: '.env' });

async function run() {
  try {
    const res = await fetch(`${process.env.VELOUR_WC_URL}/wp-json/wc/v3/orders/27441267`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.VELOUR_WC_KEY}:${process.env.VELOUR_WC_SECRET}`).toString('base64')
      }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    if (res.status === 200) {
      console.log("Found order:", data.id, "Status:", data.status);
    } else {
      console.log("Error:", data);
    }
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
run();
