import { db } from "@/lib/db";
import { bankOfTasks } from "@/lib/db/schema";
import TasksClient from "./tasks-client";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await db.select().from(bankOfTasks).orderBy(asc(bankOfTasks.itemIndex));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="col-span-1 lg:col-span-12 glass-panel rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">בנק משימות</h1>
          <p className="text-slate-200 mt-1">ניהול ומעקב אחרי כלל המשימות בארגון</p>
        </div>
      </div>
      
      <TasksClient initialTasks={tasks} />
    </div>
  );
}
