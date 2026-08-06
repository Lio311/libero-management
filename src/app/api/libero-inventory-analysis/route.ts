import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const ck = process.env.LIBERO_WC_CK;
    const cs = process.env.LIBERO_WC_CS;
    const baseUrl = 'https://libero-il.co.il';

    if (!ck || !cs) {
        return NextResponse.json({ error: 'חסרים מפתחות גישה ל-WooCommerce (LIBERO_WC_CK/CS)' }, { status: 500 });
    }

    const auth = Buffer.from(`${ck}:${cs}`).toString('base64');

    const apiFetch = async (endpoint: string, query: string = '') => {
        const url = `${baseUrl}/wp-json/wc/v3/${endpoint}?${query}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Vercel-Function'
                }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                return [];
            }
            return await response.json();
        } catch (e) {
            clearTimeout(timeoutId);
            return [];
        }
    };

    try {
        console.log('Starting Fast Smart Inventory Analysis for Vercel...');

        // 1. Fetch initial product pages in parallel (up to 15 pages = 1500 items max for speed)
        const productPromises = Array.from({ length: 10 }, (_, i) =>
            apiFetch('products', `per_page=100&status=any&_fields=id,name,sku,price,stock_quantity,date_created,categories,status&page=${i + 1}`)
        );

        // Fetch parallel resources: reports + orders pages
        const orderPromises = Array.from({ length: 4 }, (_, i) =>
            apiFetch('orders', `per_page=100&status=processing,completed&_fields=id,total,date_created,line_items,customer_id&page=${i + 1}`)
        );

        const customerReportPromise = apiFetch('reports/customers/totals');
        const salesTrendPromise = apiFetch('reports/sales', `date_min=${new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
        const couponReportPromise = apiFetch('reports/coupons/totals', 'per_page=10');

        const [productResults, orderResults, customerTotalsVal, salesTrendVal, couponReportVal] = await Promise.all([
            Promise.all(productPromises),
            Promise.all(orderPromises),
            customerReportPromise,
            salesTrendPromise,
            couponReportPromise
        ]);

        const allProducts = productResults.filter(Array.isArray).flat().filter(p => p && p.id);
        const allOrders = orderResults.filter(Array.isArray).flat().filter(o => o && o.id);

        if (allProducts.length === 0) {
            return NextResponse.json({ error: 'לא נמצאו מוצרים באתר' }, { status: 500 });
        }

        // 2. Process KPIs
        let totalSales = 0;
        let totalOrders = allOrders.length;
        const uniqueCustomers = new Set();

        allOrders.forEach(order => {
            totalSales += parseFloat(order.total || 0);
            if (order.customer_id && order.customer_id > 0) {
                uniqueCustomers.add(order.customer_id);
            }
        });

        let totalCustomers = 0;
        if (Array.isArray(customerTotalsVal) && customerTotalsVal.length > 0) {
            customerTotalsVal.forEach(item => {
                if (item.slug === 'paying') {
                    totalCustomers += parseInt(item.total || 0);
                }
            });
        }
        if (totalCustomers === 0) {
            totalCustomers = uniqueCustomers.size;
        }

        const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
        const ltv = totalCustomers > 0 ? totalSales / totalCustomers : 0;

        // 3. Process Product Velocity & Dead Stock
        const salesMap: Record<number, { quantity: number; total: number }> = {};
        allOrders.forEach(order => {
            if (Array.isArray(order.line_items)) {
                order.line_items.forEach((item: any) => {
                    if (!salesMap[item.product_id]) {
                        salesMap[item.product_id] = { quantity: 0, total: 0 };
                    }
                    salesMap[item.product_id].quantity += item.quantity || 0;
                    salesMap[item.product_id].total += parseFloat(item.total || 0);
                });
            }
        });

        const now = new Date();
        const analyzedProducts = allProducts.map(p => {
            const sales = salesMap[p.id] || { quantity: 0, total: 0 };
            const calculatedAge = Math.floor((now.getTime() - new Date(p.date_created).getTime()) / (1000 * 60 * 60 * 24)) || 1;
            const velocityAgeDays = Math.min(calculatedAge, 90);

            const salesVelocity = sales.quantity / (velocityAgeDays > 30 ? (velocityAgeDays / 30) : 1);
            const dos = salesVelocity > 0 ? (p.stock_quantity || 0) / (salesVelocity / 30) : (p.stock_quantity > 0 ? 9999 : 0);

            const categoryName = (Array.isArray(p.categories) && p.categories[0]) ? p.categories[0].name : 'אחר';

            return {
                id: p.id,
                name: p.name,
                sku: p.sku || '',
                price: parseFloat(p.price) || 0,
                stock: p.stock_quantity || 0,
                date_created: p.date_created,
                age_days: calculatedAge,
                total_sales_qty: Math.round(sales.quantity * (calculatedAge / velocityAgeDays)),
                total_revenue: sales.total * (calculatedAge / velocityAgeDays),
                sales_velocity: salesVelocity,
                dos: dos,
                status: p.status || 'publish',
                categories: [categoryName]
            };
        });

        const deadStock = analyzedProducts
            .filter(p => p.dos > 360 && p.age_days > 90 && p.stock > 0)
            .sort((a, b) => (b.stock * b.price) - (a.stock * a.price));

        // 4. Sales Trend
        let finalSalesTrend = Array.isArray(salesTrendVal) ? salesTrendVal : [];
        if (finalSalesTrend.length <= 1 && allOrders.length > 0) {
            const trendMap: Record<string, number> = {};
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = d.toISOString().substring(0, 7);
                trendMap[monthStr] = 0;
            }
            allOrders.forEach(o => {
                const month = (o.date_created || '').substring(0, 7);
                if (trendMap[month] !== undefined) {
                    trendMap[month] += parseFloat(o.total || 0);
                }
            });
            finalSalesTrend = Object.entries(trendMap)
                .map(([month, total]) => ({ month, total_sales: total }))
                .sort((a, b) => a.month.localeCompare(b.month));
        }

        const couponTypeMap: Record<string, string> = {
            'percent': 'אחוז הנחה',
            'fixed_cart': 'הנחה קבועה לעגלה',
            'fixed_product': 'הנחה קבועה למוצר',
            'shipping': 'משלוח חינם'
        };

        const ltvBySource = Array.isArray(couponReportVal) ? couponReportVal.map(c => ({
            source: couponTypeMap[c.slug] || c.slug || 'אחר',
            total_sales: parseFloat(c.total || 0),
            orders: c.orders || 0,
            aov: c.orders > 0 ? parseFloat(c.total) / c.orders : 0
        })).sort((a, b) => b.total_sales - a.total_sales) : [];

        const totalItemsInStock = analyzedProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
        const totalProductsVariety = analyzedProducts.length;

        const statusBreakdown = {
            publish: 0,
            outofstock: 0,
            draft: 0
        };

        analyzedProducts.forEach(p => {
            if (p.stock <= 0) {
                statusBreakdown.outofstock += 1;
            } else if (p.status === 'publish') {
                statusBreakdown.publish += 1;
            } else if (p.status === 'draft') {
                statusBreakdown.draft += 1;
            }
        });

        const formattedStatusBreakdown = [
            { name: 'במלאי', value: statusBreakdown.publish },
            { name: 'לא במלאי', value: statusBreakdown.outofstock },
            { name: 'טיוטה', value: statusBreakdown.draft },
        ].filter(s => s.value > 0);

        return NextResponse.json({
            kpis: {
                total_revenue: totalSales,
                total_orders: totalOrders,
                total_customers: totalCustomers,
                aov: aov,
                ltv: ltv,
                total_items_in_stock: totalItemsInStock,
                total_products_variety: totalProductsVariety
            },
            status_breakdown: formattedStatusBreakdown,
            sales_trend: finalSalesTrend,
            products: analyzedProducts.sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 50),
            dead_stock: deadStock.slice(0, 30),
            ltv_by_source: ltvBySource,
            debug: {
                totalProductsFetched: allProducts.length,
                totalOrdersFetched: allOrders.length
            }
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
