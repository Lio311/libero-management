import { db } from '@/lib/db';
import { monthlySchedule, bankOfTasks, qcProducts, qcInspections } from '@/lib/db/schema';
import { NotificationsBell } from './notifications-bell';
import { cookies } from 'next/headers';
import { eq, desc } from 'drizzle-orm';

export async function GlobalNotifications() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    return null;
  }

  const scheduleData = await db.select().from(monthlySchedule);
  const bankTasksData = await db.select().from(bankOfTasks);
  
  // Calculate QC pending count
  let qcPendingCount = 0;
  try {
    const products = await db.select().from(qcProducts);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    for (const product of products) {
      const inspections = await db
        .select()
        .from(qcInspections)
        .where(eq(qcInspections.productId, product.id))
        .orderBy(desc(qcInspections.inspectedAt))
        .limit(1);
      
      if (inspections.length === 0 || inspections[0].inspectedAt < threeMonthsAgo) {
        qcPendingCount++;
      }
    }
  } catch {
    // QC tables may not exist yet, silently handle
  }
  
  return (
    <NotificationsBell scheduleData={scheduleData} bankTasksData={bankTasksData} qcPendingCount={qcPendingCount} />
  );
}

