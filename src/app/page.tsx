import CalendarClient from './calendar-client';
import { db } from '@/lib/db';
import { monthlySchedule, bankOfTasks } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const scheduleData = await db.select().from(monthlySchedule);
  const bankTasksData = await db.select().from(bankOfTasks);

  const totalScheduleTasks = scheduleData.length;
  const completedScheduleTasks = scheduleData.filter(t => t.status === 'בוצע').length;
  const pendingBankTasks = bankTasksData.filter(t => t.status !== 'בוצע').length;

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto w-full text-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 max-w-7xl mx-auto">
        
        {/* Top Stats Cards */}
        <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-slate-300 text-sm md:text-base mb-2 uppercase tracking-widest font-medium">סה״כ משימות קבועות</h3>
            <p className="text-white text-4xl md:text-5xl font-light">{totalScheduleTasks}</p>
          </div>
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-slate-300 text-sm md:text-base mb-2 uppercase tracking-widest font-medium">משימות שבוצעו</h3>
            <p className="text-white text-4xl md:text-5xl font-light">{completedScheduleTasks}</p>
          </div>
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-slate-300 text-sm md:text-base mb-2 uppercase tracking-widest font-medium">משימות בנק בהמתנה</h3>
            <p className="text-white text-4xl md:text-5xl font-light">{pendingBankTasks}</p>
          </div>
        </div>

        {/* Main Calendar Card */}
        <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-4 md:p-6 flex flex-col shadow-2xl">
          <CalendarClient 
            scheduleData={scheduleData}
            bankTasksData={bankTasksData}
          />
        </div>
      </div>
    </div>
  );
}
