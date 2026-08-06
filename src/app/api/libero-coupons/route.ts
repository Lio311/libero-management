import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ error: 'Month parameter is required (YYYY-MM)' }, { status: 400 });
    }

    const ck = process.env.LIBERO_WC_CK || '[REDACTED_CK]';
    const cs = process.env.LIBERO_WC_CS || '[REDACTED_CS]';
    const baseUrl = 'https://libero-il.co.il';

    if (!ck || !cs) {
        return NextResponse.json({
            error: 'Missing WooCommerce credentials in Environment Variables',
            details: 'Please set LIBERO_WC_CK and LIBERO_WC_CS environment variables.'
        }, { status: 500 });
    }

    const auth = Buffer.from(`${ck}:${cs}`).toString('base64');
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const after = new Date(Date.UTC(year, monthIdx, 1)).toISOString();
    const before = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59)).toISOString();

    const fetchOrdersPage = async (page = 1) => {
        const query = `after=${after}&before=${before}&per_page=100&page=${page}&status=processing,completed`;
        const url = `${baseUrl}/wp-json/wc/v3/orders?${query}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`WooCommerce API error: ${response.status}`);
        }

        return await response.json();
    };

    try {
        let allOrders: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
            const orders = await fetchOrdersPage(page);
            allOrders = allOrders.concat(orders);
            if (orders.length < 100) {
                hasMore = false;
            } else {
                page++;
            }
        }

        const couponStats: Record<string, any> = {};
        allOrders.forEach(order => {
            if (order.coupon_lines && order.coupon_lines.length > 0) {
                order.coupon_lines.forEach((cl: any) => {
                    const code = cl.code.toLowerCase();
                    if (!couponStats[code]) {
                        couponStats[code] = { code: cl.code, count: 0, total_sales: 0 };
                    }
                    couponStats[code].count += 1;
                    const netSales = (order.line_items || []).reduce((acc: number, li: any) => acc + parseFloat(li.total || 0), 0);
                    couponStats[code].total_sales += netSales;
                });
            }
        });

        const data = Object.values(couponStats).sort((a: any, b: any) => b.total_sales - a.total_sales);
        return NextResponse.json({ data, error: null }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, data: null }, { status: 500 });
    }
}
