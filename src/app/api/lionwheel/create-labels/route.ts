import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedShippingLabels } from '@/lib/db/schema';

const LIONWHEEL_API_KEY = (process.env.LIONWHEEL_API_KEY || "").replace(/['"]/g, '').trim();
const LIONWHEEL_ENDPOINT = "https://members.lionwheel.com/api/v1/tasks/create";

export async function POST(request: Request) {
  try {
    const { customers } = await request.json();

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ error: 'Invalid customers payload' }, { status: 400 });
    }

    const results = [];

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    for (const customer of customers) {
      const payload = {
        pickup_at: formattedDate,
        original_order_id: (customer.latestOrderId || `CUST-${customer.id}`) + `-${Date.now()}`,
        company: { name: "ליברו", external_id: "libero" },
        destination_city: customer.city || "לא ידוע",
        destination_street: customer.address_1 || "לא ידוע",
        destination_number: "0",
        destination_recipient_name: customer.fullName || "לא ידוע",
        destination_phone: customer.phone || "לא ידוע",
        destination_email: customer.email || "",
        notes: "נוצר אוטומטית ממערכת בקרת לקוחות",
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
        console.error(`Lionwheel error for customer ${customer.id}:`, errorText);
        results.push({ customerId: customer.id, success: false, error: errorText });
      } else {
        const data = await response.json();
        results.push({ customerId: customer.id, success: true, data });
        
        try {
          await db.insert(generatedShippingLabels).values({
            orderId: payload.original_order_id,
            customerId: customer.id?.toString() || "",
            customerName: customer.fullName || "לא ידוע",
            labelUrl: data.label || data.pdf_link || data.label_url || "",
            trackingUrl: data.tracking_link || data.tracking_url || "",
            barcode: data.barcode || data.tracking_number || "",
          });
        } catch (dbError) {
          console.error(`Failed to save shipping label for customer ${customer.id} to db:`, dbError);
        }
      }
    }

    const allSuccessful = results.every((r) => r.success);
    
    return NextResponse.json(
      { results, allSuccessful }, 
      { status: allSuccessful ? 200 : 207 }
    );
  } catch (error: any) {
    console.error('Error creating Lionwheel labels:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
