import { db } from './src/lib/db';
import { teamTasks, roleHolders, teamTaskConnections } from './src/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import * as fs from 'fs';

async function updateDb() {
  const jsonStr = fs.readFileSync('roles_data.json', 'utf8');
  const tasksByPerson = JSON.parse(jsonStr);
  
  console.log('Starting DB update...');
  for (const [person, tasks] of Object.entries(tasksByPerson)) {
    // Get or create role holder
    let rh = await db.select().from(roleHolders).where(eq(roleHolders.name, person));
    if (rh.length === 0) {
      await db.insert(roleHolders).values({ name: person, role: '' });
    }
    
    // Get existing tasks for this person
    const existingTasks = await db.select().from(teamTasks).where(eq(teamTasks.assignee, person));
    const existingTaskNames = existingTasks.map(t => t.taskDescription);
    
    // Add new tasks
    for (const task of (tasks as string[])) {
      if (!existingTaskNames.includes(task)) {
        console.log(`Adding task '${task}' to ${person}`);
        await db.insert(teamTasks).values({ assignee: person, taskDescription: task });
      }
    }
    
    // Remove tasks that are no longer in the Excel
    for (const extTask of existingTasks) {
      if (!(tasks as string[]).includes(extTask.taskDescription)) {
        console.log(`Removing task '${extTask.taskDescription}' from ${person}`);
        // First delete connections
        await db.delete(teamTaskConnections).where(
          or(
            eq(teamTaskConnections.sourceTaskId, extTask.id),
            eq(teamTaskConnections.targetTaskId, extTask.id)
          )
        );
        // Then delete the task
        await db.delete(teamTasks).where(eq(teamTasks.id, extTask.id));
      }
    }
  }
  console.log('Done.');
}

updateDb().catch(console.error);
