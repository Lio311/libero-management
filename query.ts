import { db } from "./src/lib/db";
import { roleHolders, teamTasks } from "./src/lib/db/schema";
async function run() {
  const roles = await db.select().from(roleHolders);
  console.log("ROLES:", roles.map(r => ({ id: r.id, name: r.name })));
  
  const tasks = await db.select().from(teamTasks);
  const assignees = new Set(tasks.map(t => t.assignee));
  console.log("ASSIGNEES IN TASKS:", Array.from(assignees));
}
run();
