import { db } from '@/lib/db';
import { monthlySchedule, bankOfTasks } from '@/lib/db/schema';
import { NotificationsBell } from './notifications-bell';

export async function GlobalNotifications() {
  const scheduleData = await db.select().from(monthlySchedule);
  const bankTasksData = await db.select().from(bankOfTasks);
  
  return (
    <NotificationsBell scheduleData={scheduleData} bankTasksData={bankTasksData} />
  );
}
