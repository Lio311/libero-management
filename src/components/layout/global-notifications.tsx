import { db } from '@/lib/db';
import { monthlySchedule, bankOfTasks } from '@/lib/db/schema';
import { NotificationsBell } from './notifications-bell';
import { cookies } from 'next/headers';

export async function GlobalNotifications() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    return null;
  }

  const scheduleData = await db.select().from(monthlySchedule);
  const bankTasksData = await db.select().from(bankOfTasks);
  
  return (
    <NotificationsBell scheduleData={scheduleData} bankTasksData={bankTasksData} />
  );
}
