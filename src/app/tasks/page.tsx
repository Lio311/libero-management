import { db } from "@/lib/db";
import { bankOfTasks } from "@/lib/db/schema";
import TasksClient from "./tasks-client";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await db.select().from(bankOfTasks).orderBy(asc(bankOfTasks.itemIndex));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">בנק משימות</h1>
          <p className="text-muted-foreground mt-1">ניהול ומעקב אחרי כלל המשימות בארגון</p>
        </div>
      </div>
      
      <TasksClient initialTasks={tasks} />
    </div>
  );
}
