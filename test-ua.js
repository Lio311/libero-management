const ck = 'ck_c551947f6cd4c709b527cab0f18651cf19433b51';
const cs = 'cs_c32883b9954569200ebea224812180dad9cc01dc';
const baseUrl = 'https://libero-il.co.il';
const auth = Buffer.from(`${ck}:${cs}`).toString('base64');

async function test() {
    console.log("Fetching with Vercel User-Agent...");
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=1`, {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Vercel-Function'
        }
    });
    console.log(response.status, response.statusText);
    if (!response.ok) {
        console.log((await response.text()).substring(0, 500));
    }
}
test();
