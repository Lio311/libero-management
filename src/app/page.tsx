import CalendarClient from './calendar-client';
import { db } from '@/lib/db';
import { monthlySchedule, bankOfTasks } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const scheduleData = await db.select().from(monthlySchedule);
  const bankTasksData = await db.select().from(bankOfTasks);

  return (
    <CalendarClient 
      scheduleData={scheduleData}
      bankTasksData={bankTasksData}
    />
  );
}
