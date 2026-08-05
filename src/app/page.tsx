import CalendarClient from './calendar-client';
import { db } from '@/lib/db';
import { monthlySchedule, chinaOrders } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const scheduleData = await db.select().from(monthlySchedule);
  const ordersData = await db.select().from(chinaOrders);

  return (
    <CalendarClient 
      scheduleData={scheduleData}
      ordersData={ordersData}
    />
  );
}
