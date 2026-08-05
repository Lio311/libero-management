import { db } from "@/lib/db";
import { teamTasks, roleHolders, teamTaskConnections } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import TeamClient from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  let allTasksRaw: any[] = [];
  let roleHoldersRaw: any[] = [];
  let connectionsRaw: any[] = [];

  try {
    allTasksRaw = await db.select().from(teamTasks).orderBy(asc(teamTasks.assignee));
    roleHoldersRaw = await db.select().from(roleHolders);
    connectionsRaw = await db.select().from(teamTaskConnections);
  } catch (e) {
    console.error("Database connection failed, using empty data:", e);
  }

  // Group by assignee
  const groupedTasks: Record<string, { id: string, description: string }[]> = {};
  for (const task of allTasksRaw) {
    if (task.assignee) {
      if (!groupedTasks[task.assignee]) {
        groupedTasks[task.assignee] = [];
      }
      groupedTasks[task.assignee].push({ id: task.id, description: task.taskDescription || "" });
    }
  }

  return (
    <TeamClient 
      roleHolders={roleHoldersRaw}
      groupedTasks={groupedTasks}
      connections={connectionsRaw}
    />
  );
}
