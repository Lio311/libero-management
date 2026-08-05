/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { inventoryItems, suppliers } from "@/lib/db/schema";
import InventoryClient from "./inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryDashboard() {
  let totalInventoryValue = 0;
  let itemsAtRisk = 0;
  let goodsOnTheWay = 0;
  let activeSkus = 0;
  let stockHealthData: { brand: string; current: number; target: number; status: string; color: string }[] = [];
  let lowStockItems: { name: string; brand: string; current: number; target: number }[] = [];
  let allItems: any[] = [];

    let suppliersData: any[] = [];

    try {
      const items = await db.select().from(inventoryItems);
      allItems = items;
      
      activeSkus = items.length;
      
      // Group by brand
      const brandData: Record<string, { current: number; target: number }> = {};
      
      items.forEach(item => {
        const current = Number(item.currentStock || 0);
        const target = Number(item.targetStockLevel || 0);
        const cost = Number(item.costPrice || 0);
        const ordered = Number(item.orderedQuantity || 0);
        
        totalInventoryValue += (current * cost);
        goodsOnTheWay += ordered;
        
        if (target > 0 && current < target * 0.2) {
          itemsAtRisk++;
        }
        
        const brand = item.brand || 'אחר';
        if (!brandData[brand]) {
          brandData[brand] = { current: 0, target: 0 };
        }
        brandData[brand].current += current;
        brandData[brand].target += target;
      });

      const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
      stockHealthData = Object.entries(brandData).map(([brand, data], index) => {
        const ratio = data.target > 0 ? data.current / data.target : 1;
        let status = 'good';
        let color = colors[0]; // green
        if (ratio < 0.2) {
          status = 'danger';
          color = colors[2]; // red
        } else if (ratio < 0.5) {
          status = 'warning';
          color = colors[1]; // yellow
        }
        
        return {
          brand,
          current: data.current,
          target: data.target,
          status,
          color
        };
      });

      // Top 5 items with lowest ratio
      const itemsWithRatio = items.map(item => {
        const current = Number(item.currentStock || 0);
        const target = Number(item.targetStockLevel || 1);
        return {
          name: item.modelName || 'לא ידוע',
          brand: item.brand || 'לא ידוע',
          current,
          target,
          ratio: current / target
        };
      }).filter(i => i.ratio < 0.5).sort((a, b) => a.ratio - b.ratio);
      
      lowStockItems = itemsWithRatio.slice(0, 5);

      suppliersData = await db.select().from(suppliers);

    } catch (e) {
    console.error("Database connection failed, using empty data:", e);
  }

  return (
    <InventoryClient 
      totalInventoryValue={totalInventoryValue}
      itemsAtRisk={itemsAtRisk}
      goodsOnTheWay={goodsOnTheWay}
      activeSkus={activeSkus}
      stockHealthData={stockHealthData}
      lowStockItems={lowStockItems}
      inventoryItems={allItems}
      suppliers={suppliersData || []}
    />
  );
}
