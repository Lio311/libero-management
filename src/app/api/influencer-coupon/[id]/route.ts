import { NextResponse } from 'next/server';
import { getInfluencerById, Brand, InfluencerCoupon } from '@/config/influencers';
import { db } from '@/lib/db';
import { influencers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const BRAND_CONFIG: Record<Brand, { ck: string; cs: string; baseUrl: string }> = {
    velour: {
        ck: 'ck_50e2712ebe187cae81f5a2b6353c0a316067eefe',
        cs: 'cs_fe5ad58ff939b47a0856f5a9c3478cefa5c74c04',
        baseUrl: 'https://velour.co.il',
    },
    labura: {
        ck: 'ck_c05a4ccf7b36d2c7f5aeee1307db0da45512c306',
        cs: 'cs_d3d1d9eba2cf904b5a4b4324b1fba75d4a1da2c2',
        baseUrl: 'https://la-burro.co.il',
    },
    libero: {
        ck: '[REDACTED_CK]',
        cs: '[REDACTED_CS]',
        baseUrl: 'https://libero-il.co.il',
    }
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ error: 'Month parameter is required (YYYY-MM)' }, { status: 400 });
    }

    const influencer = getInfluencerById(id);
    if (!influencer) {
        return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const after = new Date(Date.UTC(year, monthIdx, 1)).toISOString();
    const before = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59)).toISOString();

    let baseSalary = 0;
    try {
        const dbInfluencers = await db.select().from(influencers).where(eq(influencers.influencerId, id));
        if (dbInfluencers.length > 0 && dbInfluencers[0].baseSalary) {
            baseSalary = Number(dbInfluencers[0].baseSalary);
        }
    } catch (e) {
        console.error("Error fetching base salary from db:", e);
    }

    const fetchOrdersForBrand = async (brand: Brand, coupons: string[]) => {
        const config = BRAND_CONFIG[brand];
        const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
        
        const fetchPage = async (page = 1) => {
            const query = `after=${after}&before=${before}&per_page=100&page=${page}&status=processing,completed`;
            const url = `${config.baseUrl}/wp-json/wc/v3/orders?${query}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`Error fetching from ${brand}: ${response.status}`);
                return [];
            }
            return await response.json();
        };

        let allOrders: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
            const orders = await fetchPage(page);
            allOrders = allOrders.concat(orders);
            if (orders.length < 100) {
                hasMore = false;
            } else {
                page++;
            }
        }

        // Filter orders by any of the influencer's coupons for this brand
        const lowerCoupons = coupons.map(c => c.toLowerCase());
        const filteredOrders = allOrders.filter(order => 
            order.coupon_lines?.some((cl: any) => lowerCoupons.includes(cl.code.toLowerCase()))
        );

        return filteredOrders.map((order: any) => {
            // Find the specific coupon used
            const couponLine = order.coupon_lines.find((cl: any) => lowerCoupons.includes(cl.code.toLowerCase()));
            const itemsTotal = (order.line_items || []).reduce((acc: number, li: any) => acc + parseFloat(li.total || 0), 0);

            return {
                brand,
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
                discount_amount: parseFloat(couponLine?.discount || 0),
                total: parseFloat(order.total || 0),
                payment_method: order.payment_method_title || '',
                shipping_city: order.shipping?.city || order.billing?.city || '',
                coupon_used: couponLine?.code || '',
            };
        });
    };

    try {
        // Group coupons by brand
        const couponsByBrand = influencer.coupons.reduce((acc, curr) => {
            if (!acc[curr.brand]) acc[curr.brand] = [];
            acc[curr.brand].push(curr.code);
            return acc;
        }, {} as Record<Brand, string[]>);

        // Fetch from all relevant brands concurrently
        const fetchPromises = Object.entries(couponsByBrand).map(([brandStr, codes]) => {
            return fetchOrdersForBrand(brandStr as Brand, codes);
        });

        const results = await Promise.all(fetchPromises);
        let detailedOrders: any[] = results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // --- Amit's Duduar Tracking Logic ---
        let duduar_bottles = 0;
        let duduar_revenue = 0;
        let duduar_commission = 0;

        if (id === 'amit') {
            const liberoConfig = BRAND_CONFIG['libero'];
            const liberoAuth = Buffer.from(`${liberoConfig.ck}:${liberoConfig.cs}`).toString('base64');
            
            const fetchLiberoPage = async (page = 1) => {
                const query = `after=${after}&before=${before}&per_page=100&page=${page}&status=processing,completed`;
                const url = `${liberoConfig.baseUrl}/wp-json/wc/v3/orders?${query}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${liberoAuth}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) return [];
                return await response.json();
            };

            let allLiberoOrders: any[] = [];
            let p = 1;
            let hasMoreLibero = true;
            while (hasMoreLibero && p <= 10) {
                const orders = await fetchLiberoPage(p);
                allLiberoOrders = allLiberoOrders.concat(orders);
                if (orders.length < 100) hasMoreLibero = false;
                else p++;
            }

            allLiberoOrders.forEach(order => {
                let orderDuduarBottles = 0;
                let orderDuduarRevenue = 0;
                const duduarItems: any[] = [];

                order.line_items?.forEach((li: any) => {
                    const name = (li.name || '').toLowerCase();
                    if (name.includes('duduar') || name.includes('דודואר')) {
                        orderDuduarBottles += li.quantity;
                        orderDuduarRevenue += parseFloat(li.total || 0);
                        duduarItems.push({
                            name: li.name,
                            quantity: li.quantity,
                            price: parseFloat(li.price || 0),
                            total: parseFloat(li.total || 0),
                            sku: li.sku || ''
                        });
                    }
                });

                if (orderDuduarBottles > 0) {
                    duduar_bottles += orderDuduarBottles;
                    duduar_revenue += orderDuduarRevenue;
                    duduar_commission += orderDuduarBottles * 25; // 25 NIS per bottle
                    
                    // Add the Duduar order to detailed orders if it's not already there
                    const existingOrderIndex = detailedOrders.findIndex(o => o.order_id === order.id && o.brand === 'libero');
                    if (existingOrderIndex === -1) {
                        detailedOrders.push({
                            brand: 'libero',
                            order_id: order.id,
                            order_number: order.number,
                            date: order.date_created,
                            status: order.status,
                            customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
                            customer_email: order.billing?.email || '',
                            customer_phone: order.billing?.phone || '',
                            items: duduarItems,
                            items_count: orderDuduarBottles,
                            subtotal: orderDuduarRevenue,
                            discount_amount: 0, // Not tied to his coupon necessarily
                            total: parseFloat(order.total || 0),
                            payment_method: order.payment_method_title || '',
                            shipping_city: order.shipping?.city || order.billing?.city || '',
                            coupon_used: 'DUDUAR_SALE',
                            is_duduar_only: true
                        });
                    }
                }
            });
            
            // Re-sort after adding Duduar orders
            detailedOrders = detailedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        const totalRevenue = detailedOrders.reduce((acc: number, o: any) => acc + o.subtotal, 0);

        const brand_summaries: Record<string, any> = {};
        for (const brand of Object.keys(couponsByBrand)) {
            const brandOrders = detailedOrders.filter(o => o.brand === brand && !o.is_duduar_only);
            const brandRevenue = brandOrders.reduce((acc: number, o: any) => acc + o.subtotal, 0);
            
            const brandCommission = brandOrders.reduce((acc: number, o: any) => {
                let commRate = 0.10;
                if (o.coupon_used.toLowerCase().includes('15') || id === 'reut') {
                    commRate = 0.15;
                }
                
                let comm = (o.subtotal / 1.18) * commRate;
                const noVatAddBack = ['maayan', 'tal', 'ayala', 'gold', 'noga', 'liya', 'shaked', 'hf', 'lian', 'reut'];
                if (!noVatAddBack.includes(id)) {
                    comm = comm * 1.18;
                }
                return acc + comm;
            }, 0);

            brand_summaries[brand] = {
                total_orders: brandOrders.length,
                total_revenue: brandRevenue,
                total_discount: brandOrders.reduce((acc: number, o: any) => acc + o.discount_amount, 0),
                total_items: brandOrders.reduce((acc: number, o: any) => acc + o.items_count, 0),
                avg_order_value: brandOrders.length > 0 ? brandRevenue / brandOrders.length : 0,
                commission: Math.round(brandCommission * 100) / 100
            };
        }

        const summary = {
            base_salary: baseSalary,
            total_orders: detailedOrders.length,
            total_revenue: totalRevenue,
            total_discount: detailedOrders.reduce((acc: number, o: any) => acc + o.discount_amount, 0),
            total_items: detailedOrders.reduce((acc: number, o: any) => acc + o.items_count, 0),
            avg_order_value: detailedOrders.length > 0 ? totalRevenue / detailedOrders.length : 0,
            commission: Math.round((detailedOrders.reduce((acc: number, o: any) => {
                if (o.is_duduar_only) return acc; // Handled separately
                
                let commRate = 0.10;
                if (o.coupon_used.toLowerCase().includes('15') || id === 'reut') {
                    commRate = 0.15;
                }
                
                let comm = (o.subtotal / 1.18) * commRate;
                const noVatAddBack = ['maayan', 'tal', 'ayala', 'gold', 'noga', 'liya', 'shaked', 'hf', 'lian', 'reut', 'liz', 'yahav'];
                if (!noVatAddBack.includes(id)) {
                    comm = comm * 1.18;
                }
                return acc + comm;
            }, 0) + duduar_commission) * 100) / 100,
            brand_summaries,
            ...(id === 'amit' ? { duduar_bottles, duduar_revenue, duduar_commission } : {})
        };

        return NextResponse.json({ data: detailedOrders, summary, influencerName: influencer.name, influencerImage: influencer.image || null, error: null }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, data: null, summary: null }, { status: 500 });
    }
}
