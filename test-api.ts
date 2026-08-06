import { config } from "dotenv";
config({ path: ".env" });
import { getInfluencerById } from "./src/config/influencers";
import { db } from "./src/lib/db";
import { influencers } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";

const BRAND_CONFIG = {
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
        ck: 'ck_c551947f6cd4c709b527cab0f18651cf19433b51',
        cs: 'cs_c32883b9954569200ebea224812180dad9cc01dc',
        baseUrl: 'https://libero-il.co.il',
    }
};

async function run() {
    const month = "2026-07";
    const id = "noa";
    const influencer = getInfluencerById(id);
    
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const after = new Date(Date.UTC(year, monthIdx, 1)).toISOString();
    const before = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59)).toISOString();

    const fetchOrdersForBrand = async (brand, coupons) => {
        const c = BRAND_CONFIG[brand];
        const auth = Buffer.from(c.ck + ":" + c.cs).toString('base64');
        const query = `after=${after}&before=${before}&per_page=100&page=1&status=processing,completed`;
        const url = `${c.baseUrl}/wp-json/wc/v3/orders?${query}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });
        const orders = await response.json();
        return orders.filter(o => o.coupon_lines?.some(cl => coupons.map(c=>c.toLowerCase()).includes(cl.code.toLowerCase())));
    };

    const couponsByBrand = influencer.coupons.reduce((acc, curr) => {
        if (!acc[curr.brand]) acc[curr.brand] = [];
        acc[curr.brand].push(curr.code);
        return acc;
    }, {});

    const fetchPromises = Object.entries(couponsByBrand).map(([brandStr, codes]) => fetchOrdersForBrand(brandStr, codes));
    const results = await Promise.all(fetchPromises);
    const detailedOrders = results.flat();
    const comm = detailedOrders.reduce((acc, o) => acc + parseFloat(o.total || 0) * 0.1, 0);
    console.log("Noa July Commission:", comm);
}
run();
