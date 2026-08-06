const ck = 'ck_c551947f6cd4c709b527cab0f18651cf19433b51';
const cs = 'cs_c32883b9954569200ebea224812180dad9cc01dc';
const baseUrl = 'https://libero-il.co.il';
const auth = Buffer.from(`${ck}:${cs}`).toString('base64');

const apiFetch = async (endpoint, query = '') => {
    const url = `${baseUrl}/wp-json/wc/v3/${endpoint}?${query}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const start = Date.now();
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.log(`Failed: ${response.status} ${response.statusText} for ${url}`);
            return [];
        }
        console.log(`Success in ${Date.now() - start}ms for ${url}`);
        return await response.json();
    } catch (e) {
        clearTimeout(timeoutId);
        console.log(`Error in ${Date.now() - start}ms for ${url}:`, e.message);
        return [];
    }
};

async function test() {
    console.log("Starting concurrent fetches...");
    const productPromises = Array.from({ length: 10 }, (_, i) =>
        apiFetch('products', `per_page=100&status=any&_fields=id,name,sku,price,stock_quantity,date_created,categories,status&page=${i + 1}`)
    );
    const orderPromises = Array.from({ length: 4 }, (_, i) =>
        apiFetch('orders', `per_page=100&status=processing,completed&_fields=id,total,date_created,line_items,customer_id&page=${i + 1}`)
    );
    const customerReportPromise = apiFetch('reports/customers/totals');
    const salesTrendPromise = apiFetch('reports/sales', `date_min=${new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
    const couponReportPromise = apiFetch('reports/coupons/totals', 'per_page=10');

    await Promise.all([
        ...productPromises,
        ...orderPromises,
        customerReportPromise,
        salesTrendPromise,
        couponReportPromise
    ]);
}
test();
