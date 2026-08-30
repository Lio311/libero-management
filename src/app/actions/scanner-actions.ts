"use server";
import nodemailer from "nodemailer";

import { db } from "@/lib/db";
import { wcOrders, wcProducts, velourOrders, velourProducts, laburaOrders, laburaProducts, settings, qcProducts, generatedShippingLabels } from "@/lib/db/schema";
import { eq, desc, inArray, and, gte, count, or, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCustomerHistory } from "@/lib/customer-history";
import { getOrCalculateOrderReward, RewardOutput } from "@/lib/reward-engine";
import { guessGender } from "@/lib/gender-utils";

import { BRAND_CONFIG } from "@/lib/wc-config";

export type ScannerOrder = {
  id: number;
  customerName: string;
  total: string;
  dateCreated: string;
  status: string;
  lineItems: any[];
  isPickup: boolean;
  shippingAddress?: string;
  city?: string;
  phone?: string;
  notes?: string;
  reward?: RewardOutput;
  gender?: 'male' | 'female' | 'unknown';
  shippingNumber?: string;
  hasMultipleOrdersToday?: boolean;
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

function computeMultipleOrdersToday(orders: any[]): ScannerOrder[] {
  const counts = new Map<string, number>();
  for (const order of orders) {
    const phone = order.phone || (order.billing?.phone);
    const dateStr = order.dateCreated ? new Date(order.dateCreated).toISOString().split('T')[0] : null;
    if (phone && dateStr) {
      const key = `${phone}_${dateStr}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return orders.map(order => {
    const phone = order.phone || (order.billing?.phone);
    const dateStr = order.dateCreated ? new Date(order.dateCreated).toISOString().split('T')[0] : null;
    let hasMultiple = false;
    if (phone && dateStr) {
      const key = `${phone}_${dateStr}`;
      if ((counts.get(key) || 0) > 1) {
        hasMultiple = true;
      }
    }
    return { ...order, hasMultipleOrdersToday: hasMultiple };
  });
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
    .limit(20);

    const orders = [...processingOrders, ...completedOrders];

    const orderIdsStr = orders.map(o => o.id.toString());
    const labels = orderIdsStr.length > 0 
      ? await db.select({ orderId: generatedShippingLabels.orderId, barcode: generatedShippingLabels.barcode }).from(generatedShippingLabels).where(inArray(generatedShippingLabels.orderId, orderIdsStr))
      : [];
    const labelMap = new Map(labels.map(l => [l.orderId, l.barcode]));

    const mappedOrders = orders.map(order => {
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
        shippingAddress: (order.billing as any)?.address_1 || '',
        city: (order.billing as any)?.city || '',
        phone: (order.billing as any)?.phone || '',
        notes: (order as any).customer_note || '',
        gender: guessGender(billing?.first_name || ''),
        shippingNumber: labelMap.get(order.id.toString()) || '',
      };
    });
    
    return computeMultipleOrdersToday(mappedOrders);
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
      
    const email = billing?.email;
    const phone = billing?.phone;
    const customerId = order.customerId;
    
    // Fetch history and calculate reward
    const history = await getCustomerHistory(email, phone, customerId || undefined);
    const reward = await getOrCalculateOrderReward(order, store, history);
    
    let hasMultipleOrdersToday = false;
    const dateStr = order.dateCreated ? new Date(order.dateCreated).toISOString().split('T')[0] : null;
    if (dateStr && history?.pastOrders) {
      const todayOrders = history.pastOrders.filter(o => {
        const d = o.dateCreated ? new Date(o.dateCreated).toISOString().split('T')[0] : null;
        return d === dateStr;
      });
      if (todayOrders.length > 1) {
        hasMultipleOrdersToday = true;
      }
    }
    
    return {
      id: order.id,
      customerName: customerName || `הזמנה #${order.id}`,
      total: order.total || '0',
      dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
      status: order.status || 'processing',
      lineItems,
      isPickup,
      shippingAddress: (order.billing as any)?.address_1 || '',
      city: (order.billing as any)?.city || '',
      phone: (order.billing as any)?.phone || '',
      notes: (order as any).customer_note || '',
      reward,
      gender: guessGender(billing?.first_name || ''),
      hasMultipleOrdersToday,
    };
  } catch (error: any) {
    console.error('getOrderById error:', error);
    throw new Error(`שגיאה בשליפת הזמנה: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getScannerStats(store: "libero" | "velour" | "labura" = "libero") {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    timeZoneName: 'longOffset',
  });
  const tzParts = tzFormatter.formatToParts(now);
  const offset = tzParts.find(p => p.type === 'timeZoneName')?.value;
  const offsetStr = offset ? offset.replace('GMT', '') : '+03:00';
  
  const todayStart = new Date(`${year}-${month}-${day}T00:00:00${offsetStr}`);

  try {
    const processing = await db.select({ id: targetOrders.id }).from(targetOrders).where(eq(targetOrders.status, 'processing'));
    const completed = await db.select({ id: targetOrders.id, updatedAt: targetOrders.updatedAt })
      .from(targetOrders)
      .where(and(eq(targetOrders.status, 'completed'), gte(targetOrders.updatedAt, todayStart)));
      
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


export async function createOrderLabel(orderId: number, store: "libero" | "velour" | "labura" = "libero"): Promise<{ success: boolean; labelUrl?: string; error?: string; barcode?: string; region?: string }> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  
  try {
    const orders = await db.select().from(targetOrders).where(eq(targetOrders.id, orderId)).limit(1);
    if (orders.length === 0) return { success: false, error: 'Order not found' };

    const order = orders[0];
    const billing = order.billing as any || {};
    
    const customerName = `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || "לא ידוע";
    
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const defaultKey = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
    const velourKey = (process.env.LIONWHEEL_API_KEY_velour || "").replace(/['"]/g, '').trim() || defaultKey;
    const laburaKey = (process.env.LIONWHEEL_API_KEY_labura || "").replace(/['"]/g, '').trim() || defaultKey;
    
    let LIONWHEEL_API_KEY = defaultKey;
    if (store === "velour") LIONWHEEL_API_KEY = velourKey;
    if (store === "labura") LIONWHEEL_API_KEY = laburaKey;

    const LIONWHEEL_ENDPOINT = "https://members.lionwheel.com/api/v1/tasks/create";

    // Map store to Lionwheel company for correct label branding
    const storeCompanyMap: Record<string, { name: string; external_id: string }> = {
      libero: { name: "ליברו", external_id: "libero" },
      velour: { name: "וולור", external_id: "velour" },
      labura: { name: "לה בורה", external_id: "labura" },
    };

    // Prepare Lionwheel payload
    const payload = {
      pickup_at: formattedDate,
      original_order_id: `${orderId}-${Date.now()}`, // Prevent duplicate order IDs in lionwheel
      company: storeCompanyMap[store] || storeCompanyMap.libero,
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
    const barcode = data.barcode || data.tracking_number || "";
    const region = data.destination_region_str || "";
    
    if (labelUrl || barcode) {
      try {
        await db.insert(generatedShippingLabels).values({
          orderId: orderId.toString(),
          customerId: order.customerId?.toString() || "",
          customerName: customerName,
          labelUrl: labelUrl,
          trackingUrl: data.tracking_link || data.tracking_url || "",
          barcode: barcode,
        });
      } catch (dbError) {
        console.error("Failed to save generated label to db:", dbError);
      }
    }
    
    return { success: true, labelUrl, barcode, region };
  } catch (error: any) {
    console.error('Error creating Lionwheel label:', error);
    return { success: false, error: error.message };
  }
}

export async function clearPrintQueueAction() {
  const { auth } = await import('@clerk/nextjs/server');
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { printJobs } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');

  try {
    await db.delete(printJobs).where(eq(printJobs.status, 'pending'));
    return { success: true };
  } catch (err) {
    console.error("Failed to clear print queue:", err);
    return { success: false, error: "Failed to clear print queue" };
  }
}


export async function getArchivedCompletedOrders(store: "libero" | "velour" | "labura" = "libero", skip: number = 20): Promise<ScannerOrder[]> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
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
    .offset(skip);

    const orderIdsStr = completedOrders.map(o => o.id.toString());
    const labels = orderIdsStr.length > 0 
      ? await db.select({ orderId: generatedShippingLabels.orderId, barcode: generatedShippingLabels.barcode }).from(generatedShippingLabels).where(inArray(generatedShippingLabels.orderId, orderIdsStr))
      : [];
    const labelMap = new Map(labels.map(l => [l.orderId, l.barcode]));

    return completedOrders.map(order => {
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
        shippingAddress: (order.billing as any)?.address_1 || '',
        city: (order.billing as any)?.city || '',
        phone: (order.billing as any)?.phone || '',
        notes: (order as any).customer_note || '',
        gender: guessGender(billing?.first_name || ''),
        shippingNumber: labelMap.get(order.id.toString()) || '',
      };
    });
  } catch (error: any) {
    console.error('getArchivedCompletedOrders error:', error);
    throw new Error(`שגיאה בשליפת הזמנות: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}


export async function fixShippingLabelsDb() {
  try {
    const labels = await db.select().from(generatedShippingLabels);
    let fixedCount = 0;
    
    for (const label of labels) {
      if (label.orderId && label.orderId.includes('-')) {
        const realId = label.orderId.split('-')[0];
        if (/^\d+$/.test(realId)) {
          await db.update(generatedShippingLabels)
            .set({ orderId: realId })
            .where(eq(generatedShippingLabels.id, label.id));
          fixedCount++;
        }
      }
    }
    return { success: true, fixedCount };
  } catch(e) {
    console.error(e);
    return { success: false };
  }
}

export async function searchScannerOrders(store: "libero" | "velour" | "labura", term: string): Promise<ScannerOrder[]> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
    const termClean = term.replace(/[\[\]*]/g, '').trim().toLowerCase();
    if (!termClean) return [];

    const hebToEng: Record<string, string> = {
      '/': 'q', '\'': 'w', 'ק': 'e', 'ר': 'r', 'א': 't', 'ט': 'y', 'ו': 'u', 'ן': 'i', 'ם': 'o', 'פ': 'p',
      'ש': 'a', 'ד': 's', 'ג': 'd', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ח': 'j', 'ל': 'k', 'ך': 'l', 'ף': ';',
      'ז': 'z', 'ס': 'x', 'ב': 'c', 'ה': 'v', 'נ': 'b', 'מ': 'n', 'צ': 'm', 'ת': ',', 'ץ': '.', '.': '/'
    };
    const translatedTerm = termClean.split('').map(c => hebToEng[c] || c).join('');
    const engToHeb: Record<string, string> = {
      'q': '/', 'w': '\'', 'e': 'ק', 'r': 'ר', 't': 'א', 'y': 'ט', 'u': 'ו', 'i': 'ן', 'o': 'ם', 'p': 'פ',
      'a': 'ש', 's': 'ד', 'd': 'ג', 'f': 'כ', 'g': 'ע', 'h': 'י', 'j': 'ח', 'k': 'ל', 'l': 'ך', ';': 'ף',
      'z': 'ז', 'x': 'ס', 'c': 'ב', 'v': 'ה', 'b': 'נ', 'n': 'מ', 'm': 'צ', ',': 'ת', '.': 'ץ', '/': '.'
    };
    const translatedToHeb = termClean.split('').map(c => engToHeb[c] || c).join('');
    
    // Extract only digits. If the scanner prepended a letter (e.g. e7441267) or replaced the first digit, 
    // the remaining digits (e.g. 7441267) will still strongly match the DB tracking number.
    const digitsOnly = translatedTerm.replace(/\D/g, '');
    const hasEnoughDigits = digitsOnly.length >= 5;

    // Search generatedShippingLabels first
    const labels = await db.select().from(generatedShippingLabels)
      .where(or(
        like(generatedShippingLabels.barcode, `%${translatedTerm}%`),
        like(generatedShippingLabels.orderId, `%${translatedTerm}%`),
        like(generatedShippingLabels.barcode, `%${termClean}%`),
        like(generatedShippingLabels.orderId, `%${termClean}%`),
        hasEnoughDigits ? like(generatedShippingLabels.barcode, `%${digitsOnly}%`) : sql`FALSE`
      ))
      .limit(50);
      
    const orderIdsFromLabels = labels.map(l => {
      const id = l.orderId?.split('-')[0];
      return id ? parseInt(id, 10) : 0;
    }).filter(id => id > 0);

    const isNumeric = /^\d+$/.test(translatedTerm);
    const searchId = isNumeric ? parseInt(translatedTerm, 10) : 0;

    let dbOrders: any[] = [];
    if (searchId > 0 || orderIdsFromLabels.length > 0) {
      const idsToSearch = [];
      if (searchId > 0) idsToSearch.push(searchId);
      if (orderIdsFromLabels.length > 0) idsToSearch.push(...orderIdsFromLabels);
      
      dbOrders = await db.select({
        id: targetOrders.id,
        total: targetOrders.total,
        dateCreated: targetOrders.dateCreated,
        status: targetOrders.status,
        lineItems: targetOrders.lineItems,
        shippingLines: targetOrders.shippingLines,
        billing: targetOrders.billing,
        customerId: targetOrders.customerId,
      }).from(targetOrders)
      .where(inArray(targetOrders.id, idsToSearch));
    }
    
    if (!isNumeric && termClean.length > 2) {
       const recent = await db.select({
          id: targetOrders.id,
          total: targetOrders.total,
          dateCreated: targetOrders.dateCreated,
          status: targetOrders.status,
          lineItems: targetOrders.lineItems,
          shippingLines: targetOrders.shippingLines,
          billing: targetOrders.billing,
          customerId: targetOrders.customerId,
        }).from(targetOrders)
        .orderBy(desc(targetOrders.dateCreated))
        .limit(1000);
        
       const matched = recent.filter(o => {
         const bill = o.billing as any;
         const name = ((bill?.first_name || '') + ' ' + (bill?.last_name || '')).toLowerCase();
         const phone = (bill?.phone || '').toLowerCase();
         const lineItemsStr = JSON.stringify(o.lineItems || {}).toLowerCase();
         return name.includes(translatedTerm) || phone.includes(translatedTerm) || lineItemsStr.includes(translatedTerm) || name.includes(termClean) || phone.includes(termClean) || name.includes(translatedToHeb) || lineItemsStr.includes(translatedToHeb);
       });
       
       const existingIds = new Set(dbOrders.map(o => o.id));
       for (const m of matched) {
         if (!existingIds.has(m.id)) dbOrders.push(m);
       }
    }

    // FALLBACK TO WOOCOMMERCE API IF NOT FOUND (To catch plugin-generated tracking numbers or missing DB orders)
    if (dbOrders.length === 0 && termClean.length > 1) {
      const config = BRAND_CONFIG[store];
      if (config && config.ck && config.cs) {
        try {
          // If the original term has Hebrew letters, we should search WooCommerce with the Hebrew term
          // because it's likely a name search. If it doesn't, we can use the translatedTerm (for barcodes).
          const hasHebrew = /[א-ת]/.test(termClean);
          const wcSearchTerm = termClean;
          
          const wcUrl = `${config.baseUrl}/wp-json/wc/v3/orders?search=${encodeURIComponent(wcSearchTerm)}&consumer_key=${config.ck}&consumer_secret=${config.cs}`;
          const res = await fetch(wcUrl);
          if (res.ok) {
             const data = await res.json();
             if (Array.isArray(data) && data.length > 0) {
               for (const wcOrder of data) {
                 dbOrders.push({
                   id: wcOrder.id,
                   total: wcOrder.total,
                   dateCreated: wcOrder.date_created,
                   status: wcOrder.status,
                   lineItems: wcOrder.line_items,
                   shippingLines: wcOrder.shipping_lines,
                   billing: wcOrder.billing,
                   customerId: wcOrder.customer_id?.toString(),
                 });
                 // we can optionally save the label info if it was a barcode search
                 if (!hasHebrew && translatedTerm.length > 5) {
                   labels.push({ orderId: wcOrder.id.toString(), barcode: translatedTerm } as any);
                 }
               }
             }
          }
        } catch (e) {
          console.error("WooCommerce fallback API search failed:", e);
        }
      }
    }

    const finalIdsStr = dbOrders.map(o => o.id.toString());
    const finalLabels = finalIdsStr.length > 0 
      ? await db.select({ orderId: generatedShippingLabels.orderId, barcode: generatedShippingLabels.barcode }).from(generatedShippingLabels).where(inArray(generatedShippingLabels.orderId, finalIdsStr))
      : [];
      
    const labelMap = new Map();
    // Add the ones found in the fallback search (or initial search)
    for (const l of labels) {
      labelMap.set(l.orderId, l.barcode);
    }
    // Override with actual DB ones if exist
    for (const l of finalLabels) {
      labelMap.set(l.orderId, l.barcode);
    }

    const mappedOrders = dbOrders.map(order => {
      const billing = order.billing as any;
      const label = labelMap.get(order.id.toString());
      return {
        ...order,
        shippingNumber: label ? label : null,
        shippingAddress: billing ? `${billing.city || ''} ${billing.address_1 || ''}`.trim() : null,
        customerName: billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : null,
        phone: billing ? billing.phone : null,
        isPickup: (order.shippingLines as any[])?.some((line: any) => line.method_id === "local_pickup") || false
      };
    });
    
    return computeMultipleOrdersToday(mappedOrders);
  } catch(e) {
    console.error("searchScannerOrders error:", e);
    return [];
  }
}
