"use server";
import nodemailer from "nodemailer";

import { db } from "@/lib/db";
import { wcOrders, wcProducts, velourOrders, velourProducts, laburaOrders, laburaProducts, settings, qcProducts } from "@/lib/db/schema";
import { eq, desc, inArray, and, gte, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { BRAND_CONFIG } from "@/lib/wc-config";

export type ScannerOrder = {
  id: number;
  customerName: string;
  total: string;
  dateCreated: string;
  status: string;
  lineItems: any[];
  isPickup: boolean;
};

export async function getScannerSettings(): Promise<string[]> {
  try {
    const res = await db.select().from(settings).where(eq(settings.key, 'barcode_less_keywords')).limit(1);
    if (res.length > 0 && res[0].value) {
      return JSON.parse(res[0].value);
    }
    return ["מיני"]; // default fallback if empty
  } catch (error) {
    console.error('getScannerSettings error:', error);
    return ["מיני"];
  }
}

export async function saveScannerSettings(keywords: string[]) {
  try {
    const valueStr = JSON.stringify(keywords);
    await db.insert(settings).values({
      key: 'barcode_less_keywords',
      value: valueStr,
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: valueStr },
    });
    revalidatePath('/shipping-scanner');
    revalidatePath('/shipping-scanner/settings');
  } catch (error: any) {
    console.error('saveScannerSettings error:', error);
    throw new Error('שגיאה בשמירת הגדרות');
  }
}

export async function getProcessingOrders(store: "libero" | "velour" | "labura" = "libero"): Promise<ScannerOrder[]> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
    const processingOrders = await db.select({
      id: targetOrders.id,
      total: targetOrders.total,
      dateCreated: targetOrders.dateCreated,
      status: targetOrders.status,
      lineItems: targetOrders.lineItems,
      shippingLines: targetOrders.shippingLines,
      billing: targetOrders.billing,
      customerId: targetOrders.customerId,
    }).from(targetOrders)
    .where(eq(targetOrders.status, 'processing'))
    .orderBy(desc(targetOrders.dateCreated));

    const completedOrders = await db.select({
      id: targetOrders.id,
      total: targetOrders.total,
      dateCreated: targetOrders.dateCreated,
      status: targetOrders.status,
      lineItems: targetOrders.lineItems,
      shippingLines: targetOrders.shippingLines,
      billing: targetOrders.billing,
      customerId: targetOrders.customerId,
    }).from(targetOrders)
    .where(eq(targetOrders.status, 'completed'))
    .orderBy(desc(targetOrders.updatedAt))
    .limit(30);

    const orders = [...processingOrders, ...completedOrders];

    return orders.map(order => {
      const billing = order.billing as any;
      const customerName = billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : `לקוח ${order.customerId || 'אורח'}`;
      
      const shippingLines = Array.isArray(order.shippingLines) ? order.shippingLines : [];
      const isPickup = shippingLines.some((sl: any) => sl.method_id === 'local_pickup' || sl.method_title?.includes('איסוף עצמי'));
      
      return {
        id: order.id,
        customerName: customerName || `הזמנה #${order.id}`,
        total: order.total || '0',
        dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
        status: order.status || 'processing',
        lineItems: Array.isArray(order.lineItems) ? order.lineItems : [],
        isPickup,
      };
    });
  } catch (error: any) {
    console.error('getProcessingOrders error:', error);
    throw new Error(`שגיאה בשליפת הזמנות: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getOrderById(orderId: number, store: "libero" | "velour" | "labura" = "libero"): Promise<ScannerOrder | null> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
    const orders = await db.select({
      id: targetOrders.id,
      total: targetOrders.total,
      dateCreated: targetOrders.dateCreated,
      status: targetOrders.status,
      lineItems: targetOrders.lineItems,
      shippingLines: targetOrders.shippingLines,
      billing: targetOrders.billing,
      customerId: targetOrders.customerId,
    }).from(targetOrders)
    .where(eq(targetOrders.id, orderId))
    .limit(1);

    if (orders.length === 0) return null;

    const order = orders[0];
    const billing = order.billing as any;
    const customerName = billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : `לקוח ${order.customerId || 'אורח'}`;
    
    const shippingLines = Array.isArray(order.shippingLines) ? order.shippingLines : [];
    const isPickup = shippingLines.some((sl: any) => sl.method_id === 'local_pickup' || sl.method_title?.includes('איסוף עצמי'));
    const rawLineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
    const productIds = rawLineItems.map((item: any) => item.product_id).filter(Boolean);
    
    let imageMap = new Map();
    if (productIds.length > 0) {
      const productsImages = await db.select({
        id: qcProducts.wooProductId,
        image: qcProducts.productImage,
      }).from(qcProducts)
        .where(inArray(qcProducts.wooProductId, productIds));
        
      productsImages.forEach(p => {
        if (p.image) imageMap.set(p.id, p.image);
      });
    }

    const lineItems = rawLineItems.map((item: any) => {
      const dbImage = imageMap.get(item.product_id);
      if (dbImage) {
        if (!item.image) item.image = {};
        item.image.src = dbImage;
      }
      return item;
    });
      
    return {
      id: order.id,
      customerName: customerName || `הזמנה #${order.id}`,
      total: order.total || '0',
      dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
      status: order.status || 'processing',
      lineItems,
      isPickup,
    };
  } catch (error: any) {
    console.error('getOrderById error:', error);
    throw new Error(`שגיאה בשליפת הזמנה: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getScannerStats(store: "libero" | "velour" | "labura" = "libero") {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const processing = await db.select({ id: targetOrders.id }).from(targetOrders).where(eq(targetOrders.status, 'processing'));
    const completed = await db.select({ id: targetOrders.id, updatedAt: targetOrders.updatedAt })
      .from(targetOrders)
      .where(and(eq(targetOrders.status, 'completed'), gte(targetOrders.updatedAt, today)));
      
    return {
      completedToday: completed.length,
      remainingToProcess: processing.length
    };
  } catch (error) {
    console.error('getScannerStats error:', error);
    return { completedToday: 0, remainingToProcess: 0 };
  }
}


export async function markOrderCompleted(orderId: number, store: "libero" | "velour" | "labura" = "libero"): Promise<boolean> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  const config = BRAND_CONFIG[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
  
  try {
    // 1. Update WooCommerce
    const res = await fetch(`${config.baseUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'completed' }),
    });

    if (!res.ok) {
      console.error(`Failed to update WC order ${orderId}`, await res.text());
      return false;
    }

    // 2. Update local DB
    await db.update(targetOrders)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(targetOrders.id, orderId));

    revalidatePath('/shipping-scanner');
    revalidatePath(`/shipping-scanner/${orderId}`);
    
    return true;
  } catch (error) {
    console.error('markOrderCompleted error:', error);
    return false;
  }
}


export async function reportMissingItemsAction(data: {
  orderId: number;
  store: string;
  customerName: string;
  missingItems: Array<{ sku: string; name: string; expected: number; scanned: number }>;
}) {
  const gmailAddress = process.env.GMAIL_ADDRESS;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailAddress || !gmailPassword) {
    console.error("Missing GMAIL_ADDRESS or GMAIL_PASSWORD in env");
    return { success: false, error: "Missing email configuration" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailAddress, pass: gmailPassword },
  });

  const storeNames: Record<string, string> = {
    libero: "ליברו",
    velour: "וולור",
    labura: "לה בורה",
  };
  const storeNameHe = storeNames[data.store] || data.store;

  let itemsHtml = data.missingItems.map(item => 
    `<li>
      <strong>מק"ט:</strong> ${item.sku} <br/>
      <strong>שם מוצר:</strong> ${item.name} <br/>
      <strong>כמות שהוזמנה:</strong> ${item.expected} <br/>
      <strong>כמות שנסרקה בפועל:</strong> ${item.scanned}
    </li>`
  ).join("<br/>");

  const htmlBody = `
    <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 16px;">
      <h2 style="color: #e63946;">התראה: מוצרים חסרים בהזמנה</h2>
      <p>שלום,</p>
      <p>מחסנאי סימן את המוצרים הבאים כחסרים במערכת הסורק.</p>
      
      <div style="background: #f1faee; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <strong>חנות:</strong> ${storeNameHe} <br/>
        <strong>מספר הזמנה:</strong> #${data.orderId} <br/>
        <strong>שם לקוח:</strong> ${data.customerName}
      </div>

      <h3>פירוט החוסרים:</h3>
      <ul>
        ${itemsHtml}
      </ul>
      
      <p>נא לבדוק את ההזמנה ולטפל בהתאם.</p>
      <p><small>הודעה זו נשלחה אוטומטית ממערכת הסורק</small></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: gmailAddress,
      to: "lior31197@gmail.com", // You can use gmailAddress to send to the admin, or another specific email. Let's use gmailAddress for now as the admin, or let's use the provided email or process.env.ADMIN_EMAIL. Let's send to gmailAddress.
      subject: `התראת חוסר - חנות ${storeNameHe} הזמנה #${data.orderId}`,
      html: htmlBody,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send missing items email", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}


export async function createOrderLabel(orderId: number, store: "libero" | "velour" | "labura" = "libero"): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  
  try {
    const orders = await db.select().from(targetOrders).where(eq(targetOrders.id, orderId)).limit(1);
    if (orders.length === 0) return { success: false, error: 'Order not found' };

    const order = orders[0];
    const billing = order.billing as any || {};
    
    const customerName = `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || "לא ידוע";
    
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "c_key_ea2313a9-c33a-436a-bd4b-ed2978e51a70").replace(/['"]/g, '').trim();
    const LIONWHEEL_ENDPOINT = "https://members.lionwheel.com/api/v1/tasks/create";

    // Prepare Lionwheel payload
    const payload = {
      pickup_at: formattedDate,
      original_order_id: `${orderId}-${Date.now()}`, // Prevent duplicate order IDs in lionwheel
      destination_city: billing.city || "לא ידוע",
      destination_street: billing.address_1 || "לא ידוע",
      destination_number: "0",
      destination_recipient_name: customerName,
      destination_phone: billing.phone || "לא ידוע",
      destination_email: billing.email || "",
      notes: `הופק ממערכת סורק - חנות ${store}`,
    };

    const response = await fetch(`${LIONWHEEL_ENDPOINT}?key=${LIONWHEEL_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lionwheel error for order ${orderId}:`, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    const labelUrl = data.label || data.pdf_link || data.label_url || "";
    const barcode = data.barcode || "";
    const region = data.destination_region_str || "";
    
    return { success: true, labelUrl, barcode, region };
  } catch (error: any) {
    console.error('Error creating Lionwheel label:', error);
    return { success: false, error: error.message };
  }
}
