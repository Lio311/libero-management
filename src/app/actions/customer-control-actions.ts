'use server'

import { db } from "@/lib/db";
import { wcOrders, wcProducts, customerFlags, manualCustomers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const HOME_BRANDS_CATEGORIES = ["מותגי הבית", "פרימיום", "חדירה", "פרימיום זול"];

export type CustomerControlData = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  totalAllTime: number;
  totalLastYear: number;
  totalLastMonth: number;
  homeBrandsAllTime: number;
  homeBrandsLastYear: number;
  homeBrandsLastMonth: number;
  lastPurchaseDate: Date | null;
  averageCartValue: number;
  orderCount: number;
  city: string;
  address_1: string;
  latestOrderId: string;
  isVip: boolean;
  source: "woocommerce" | "manual";
  notes?: string;
};

export async function getCustomerControlData(): Promise<CustomerControlData[]> {
  const [orders, products, vipFlags, manualCusts] = await Promise.all([
    db.select({
      id: wcOrders.id,
      status: wcOrders.status,
      billing: wcOrders.billing,
      customerId: wcOrders.customerId,
      dateCreated: wcOrders.dateCreated,
      total: wcOrders.total,
      lineItems: wcOrders.lineItems,
    }).from(wcOrders).orderBy(desc(wcOrders.dateCreated)),
    db.select({
      id: wcProducts.id,
      categories: wcProducts.categories,
    }).from(wcProducts),
    db.select().from(customerFlags),
    db.select().from(manualCustomers),
  ]);

  // Create VIP lookup map
  const vipMap = new Map<string, boolean>();
  vipFlags.forEach(f => {
    vipMap.set(f.customerKey, f.isVip);
  });

  // Create product mapping for quick category lookup
  const productCategoryMap = new Map<number, string[]>();
  products.forEach(p => {
    if (Array.isArray(p.categories)) {
      productCategoryMap.set(p.id, p.categories.map((c: any) => c.name));
    }
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const customerMap = new Map<string, CustomerControlData>();

  orders.forEach(order => {
    // Only process completed or processing orders
    if (order.status !== 'completed' && order.status !== 'processing') return;
    
    // Parse billing info
    let billing: any = {};
    if (order.billing && typeof order.billing === 'object') {
      billing = order.billing;
    } else if (typeof order.billing === 'string') {
      try { billing = JSON.parse(order.billing); } catch (e) {}
    }

    const email = billing.email || '';
    const phone = billing.phone || '';
    const firstName = billing.first_name || '';
    const lastName = billing.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'לקוח לא ידוע';

    const customerKey = email || phone || `customer-${order.customerId}`;
    if (!customerKey || customerKey === 'customer-0') return; // Skip invalid guests

    if (!customerMap.has(customerKey)) {
      customerMap.set(customerKey, {
        id: customerKey,
        email,
        phone,
        fullName,
        totalAllTime: 0,
        totalLastYear: 0,
        totalLastMonth: 0,
        homeBrandsAllTime: 0,
        homeBrandsLastYear: 0,
        homeBrandsLastMonth: 0,
        lastPurchaseDate: null,
        averageCartValue: 0,
        orderCount: 0,
        city: billing.city || '',
        address_1: billing.address_1 || '',
        latestOrderId: order.id.toString(),
        isVip: vipMap.get(customerKey) || false,
        source: "woocommerce",
      });
    }

    const customer = customerMap.get(customerKey)!;
    
    // Use proper date objects
    const orderDate = order.dateCreated ? new Date(order.dateCreated) : new Date(0);
    const orderTotal = parseFloat(order.total?.toString() || '0');

    if (!customer.lastPurchaseDate || orderDate > customer.lastPurchaseDate) {
      customer.lastPurchaseDate = orderDate;
      // Update city/address to the most recent order's billing details
      if (billing.city) customer.city = billing.city;
      if (billing.address_1) customer.address_1 = billing.address_1;
      customer.latestOrderId = order.id.toString();
    }

    // Track order count for average calculation
    customer.orderCount += 1;

    // Add to overall totals
    customer.totalAllTime += orderTotal;
    if (orderDate >= oneYearAgo) {
      customer.totalLastYear += orderTotal;
    }
    if (orderDate >= thirtyDaysAgo) {
      customer.totalLastMonth += orderTotal;
    }

    // Calculate Home Brands totals
    if (Array.isArray(order.lineItems)) {
      let homeBrandsTotal = 0;
      order.lineItems.forEach((item: any) => {
        const itemTotal = parseFloat(item.total || '0');
        const categories = productCategoryMap.get(item.product_id) || [];
        
        // Check if product belongs to any of the Home Brands categories
        const isHomeBrand = categories.some(c => HOME_BRANDS_CATEGORIES.includes(c));
        
        if (isHomeBrand) {
          homeBrandsTotal += itemTotal;
        }
      });

      customer.homeBrandsAllTime += homeBrandsTotal;
      if (orderDate >= oneYearAgo) {
        customer.homeBrandsLastYear += homeBrandsTotal;
      }
      if (orderDate >= thirtyDaysAgo) {
        customer.homeBrandsLastMonth += homeBrandsTotal;
      }
    }
  });

  // Calculate average cart value
  const results = Array.from(customerMap.values());
  results.forEach(c => {
    c.averageCartValue = c.orderCount > 0 ? c.totalAllTime / c.orderCount : 0;
  });

  // Add manual customers
  manualCusts.forEach(mc => {
    const manualId = `manual-${mc.id}`;
    results.push({
      id: manualId,
      email: mc.email || '',
      phone: mc.phone || '',
      fullName: mc.fullName,
      totalAllTime: 0,
      totalLastYear: 0,
      totalLastMonth: 0,
      homeBrandsAllTime: 0,
      homeBrandsLastYear: 0,
      homeBrandsLastMonth: 0,
      lastPurchaseDate: null,
      averageCartValue: 0,
      orderCount: 0,
      city: mc.city || '',
      address_1: mc.address || '',
      latestOrderId: '',
      isVip: mc.isVip,
      source: "manual",
      notes: mc.notes || undefined,
    });
  });

  return results;
}

// Toggle VIP status for a customer
export async function toggleCustomerVip(customerKey: string, isVip: boolean) {
  // Check if record exists
  const existing = await db.select().from(customerFlags).where(eq(customerFlags.customerKey, customerKey));
  
  if (existing.length > 0) {
    await db.update(customerFlags).set({ isVip }).where(eq(customerFlags.customerKey, customerKey));
  } else {
    await db.insert(customerFlags).values({ customerKey, isVip });
  }

  // For manual customers, also update their isVip field directly
  if (customerKey.startsWith('manual-')) {
    const manualId = customerKey.replace('manual-', '');
    await db.update(manualCustomers).set({ isVip }).where(eq(manualCustomers.id, manualId));
  }

  revalidatePath('/customer-control');
  return { success: true };
}

// Add a manual customer (store customer)
export async function addManualCustomer(data: {
  fullName: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  notes?: string;
  isVip?: boolean;
}) {
  const result = await db.insert(manualCustomers).values({
    fullName: data.fullName,
    email: data.email || null,
    phone: data.phone || null,
    city: data.city || null,
    address: data.address || null,
    notes: data.notes || null,
    isVip: data.isVip || false,
  }).returning();

  // If VIP, also create a customer_flags entry
  if (data.isVip && result[0]) {
    const customerKey = `manual-${result[0].id}`;
    await db.insert(customerFlags).values({ customerKey, isVip: true });
  }

  revalidatePath('/customer-control');
  return { success: true, customer: result[0] };
}

// Delete a manual customer
export async function deleteManualCustomer(id: string) {
  const manualId = id.replace('manual-', '');
  
  // Delete the customer flag if exists
  await db.delete(customerFlags).where(eq(customerFlags.customerKey, id));
  
  // Delete the manual customer
  await db.delete(manualCustomers).where(eq(manualCustomers.id, manualId));
  
  revalidatePath('/customer-control');
  return { success: true };
}
