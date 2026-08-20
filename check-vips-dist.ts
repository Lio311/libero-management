import 'dotenv/config';
import { db } from "./src/lib/db";
import { wcOrders, velourOrders, laburaOrders, rewardBrandRules } from "./src/lib/db/schema";
import { guessGender } from "./src/lib/gender-utils";

async function run() {
  const validStatuses = ['completed', 'processing', 'shipped'];
  const l = await db.select().from(wcOrders);
  const v = await db.select().from(velourOrders);
  const la = await db.select().from(laburaOrders);
  const rules = await db.select().from(rewardBrandRules);
  
  const allOrders = [...l, ...v, ...la].filter(o => validStatuses.includes(o.status || ''));
  
  const customers = new Map();
  for (const o of allOrders) {
    const email = o.billing?.email?.toLowerCase()?.trim();
    if (!email) continue;
    if (!customers.has(email)) {
      customers.set(email, []);
    }
    customers.get(email).push(o);
  }
  
  const scoreCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0
  };
  
  for (const [email, orders] of customers.entries()) {
    orders.sort((a, b) => {
      const da = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const db = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return db - da;
    });
    
    const latestOrder = orders[0];
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total?.toString() || '0'), 0);
    const currentTotal = parseFloat(latestOrder.total?.toString() || '0');
    
    let historicalHouseBrandTotal = 0;
    for (const pastOrder of orders) {
      const items = Array.isArray(pastOrder.lineItems) ? pastOrder.lineItems : [];
      for (const item of items) {
        const itemName = (item.name || '').toLowerCase();
        let isHouseBrand = false;
        for (const rule of rules) {
          if (itemName.includes(rule.keyword.toLowerCase()) && rule.classification === 'house_brand') {
            isHouseBrand = true;
            break;
          }
        }
        if (isHouseBrand) {
          historicalHouseBrandTotal += parseFloat(item.total || item.price || '0');
        }
      }
    }
    
    const virtualTotalSpent = totalSpent + (historicalHouseBrandTotal * 2.0);
    
    let score = 0;
    if (historicalHouseBrandTotal > 0 && totalOrders > 1) {
      score += 2;
    }
    
    if (totalOrders === 1) {
      const virtualCurrentTotal = currentTotal + (historicalHouseBrandTotal * 2.0);
      if (virtualCurrentTotal > 1500) score += 6;
      else if (virtualCurrentTotal > 800) score += 4;
      else if (virtualCurrentTotal > 400) score += 2;
      else score += 1;
    } else {
      if (virtualTotalSpent > 5000) score += 7;
      else if (virtualTotalSpent > 3000) score += 6;
      else if (virtualTotalSpent > 1500) score += 4;
      else if (virtualTotalSpent > 800) score += 2;
      else score += 1;
    }
    
    let hasHouseBrand = false;
    let hasLuxury = false;
    
    const lineItems = Array.isArray(latestOrder.lineItems) ? latestOrder.lineItems : [];
    for (const item of lineItems) {
      const itemName = (item.name || '').toLowerCase();
      let classification = 'designer_dupe';
      for (const rule of rules) {
        if (itemName.includes(rule.keyword.toLowerCase())) {
          classification = rule.classification;
          break;
        }
      }
      
      if (classification === 'house_brand') hasHouseBrand = true;
      if (classification === 'luxury') hasLuxury = true;
    }
    
    if (hasHouseBrand) score += 3;
    else if (hasLuxury) score += 1;
    
    score = Math.min(10, score);
    if (!scoreCounts[score]) scoreCounts[score] = 0;
    scoreCounts[score]++;
  }
  
  const total = customers.size;
  console.log(`Total: ${total}`);
  for (let s = 1; s <= 10; s++) {
    const c = scoreCounts[s] || 0;
    const p = ((c / total) * 100).toFixed(2);
    console.log(`Score ${s}: ${c} customers (${p}%)`);
  }
}

run();
