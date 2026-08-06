import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ error: 'Month parameter is required (YYYY-MM)' }, { status: 400 });
    }

    const ck = 'ck_c551947f6cd4c709b527cab0f18651cf19433b51';
    const cs = 'cs_c32883b9954569200ebea224812180dad9cc01dc';
    const baseUrl = 'https://libero-il.co.il';

    const auth = Buffer.from(`${ck}:${cs}`).toString('base64');
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const after = new Date(Date.UTC(year, monthIdx, 1)).toISOString();
    const before = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59)).toISOString();

    const COUPON_CODE = 'osvr10';
    const HOUSE_BRAND_CATEGORY_ID = 268;

    const fetchHouseBrandIds = async () => {
        let page = 1;
        let hasMore = true;
        const ids = new Set<number>();

        while (hasMore) {
            const url = `${baseUrl}/wp-json/wc/v3/products?category=${HOUSE_BRAND_CATEGORY_ID}&per_page=100&page=${page}&fields=id`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch house brands page ${page}`);
                break;
            }

            const products = await response.json();
            if (products.length === 0) {
                hasMore = false;
            } else {
                products.forEach((p: any) => ids.add(p.id));
                page++;
            }
        }
        return ids;
    };

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
        const houseBrandIds = await fetchHouseBrandIds();
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

        // Filter only orders that used the osvr10 coupon
        const filteredOrders = allOrders.filter(order =>
            order.coupon_lines?.some((cl: any) => cl.code.toLowerCase() === COUPON_CODE)
        );

        // Build detailed order data
        const detailedOrders = filteredOrders.map((order: any) => {
            const couponLine = order.coupon_lines.find((cl: any) => cl.code.toLowerCase() === COUPON_CODE);
            const itemsTotal = (order.line_items || []).reduce((acc: number, li: any) => acc + parseFloat(li.total || 0), 0);

            return {
                order_id: order.id,
                order_number: order.number,
                date: order.date_created,
                status: order.status,
                customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
                customer_email: order.billing?.email || '',
                customer_phone: order.billing?.phone || '',
                items: (order.line_items || []).map((li: any) => ({
                    name: li.name,
                    quantity: li.quantity,
                    price: parseFloat(li.price || 0),
                    total: parseFloat(li.total || 0),
                    sku: li.sku || ''
                })),
                items_count: (order.line_items || []).reduce((acc: number, li: any) => acc + li.quantity, 0),
                subtotal: itemsTotal,
                house_brand_subtotal: (order.line_items || []).reduce((acc: number, li: any) => acc + (houseBrandIds.has(li.product_id) ? parseFloat(li.total || 0) : 0), 0),
                other_brand_subtotal: (order.line_items || []).reduce((acc: number, li: any) => acc + (!houseBrandIds.has(li.product_id) ? parseFloat(li.total || 0) : 0), 0),
                discount_amount: parseFloat(couponLine?.discount || 0),
                total: parseFloat(order.total || 0),
                payment_method: order.payment_method_title || '',
                shipping_city: order.shipping?.city || order.billing?.city || '',
            };
        });

        // Summary statistics
        const totalRevenue = detailedOrders.reduce((acc: number, o: any) => acc + o.subtotal, 0);
        const houseBrandRevenue = detailedOrders.reduce((acc: number, o: any) => acc + o.house_brand_subtotal, 0);
        const otherBrandRevenue = detailedOrders.reduce((acc: number, o: any) => acc + o.other_brand_subtotal, 0);
        
        const summary = {
            total_orders: detailedOrders.length,
            total_revenue: totalRevenue,
            house_brand_revenue: houseBrandRevenue,
            other_brand_revenue: otherBrandRevenue,
            total_discount: detailedOrders.reduce((acc: number, o: any) => acc + o.discount_amount, 0),
            total_items: detailedOrders.reduce((acc: number, o: any) => acc + o.items_count, 0),
            avg_order_value: detailedOrders.length > 0
                ? totalRevenue / detailedOrders.length
                : 0,
            commission: detailedOrders.reduce((acc: number, o: any) => acc + (o.subtotal / 1.18 * 0.1), 0),
        };

        return NextResponse.json({ data: detailedOrders, summary, error: null }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, data: null, summary: null }, { status: 500 });
    }
}
