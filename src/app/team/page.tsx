import { db } from "@/lib/db";
import { teamTasks } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const allTasks = await db.select().from(teamTasks).orderBy(asc(teamTasks.assignee));

  // Group by assignee
  const groupedTasks: Record<string, string[]> = {};
  for (const task of allTasks) {
    if (!groupedTasks[task.assignee]) {
      groupedTasks[task.assignee] = [];
    }
    groupedTasks[task.assignee].push(task.taskDescription);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">בעלי תפקידים</h1>
          <p className="text-muted-foreground mt-1">צפייה בתחומי האחריות של חברי הצוות</p>
        </div>
      </div>

      {Object.keys(groupedTasks).length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground shadow-sm">
          אין נתונים על בעלי תפקידים. אנא הרץ את סקריפט הייבוא.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedTasks).map(([assignee, tasks]) => (
            <div key={assignee} className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {assignee.charAt(0)}
                </div>
                <h2 className="text-xl font-semibold text-foreground">{assignee}</h2>
              </div>
              
              <ul className="space-y-3 flex-1">
                {tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
