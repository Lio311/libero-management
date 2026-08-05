import { db } from "@/lib/db";
import { wholesaleCustomers, teamTasks } from "@/lib/db/schema";
import OperationsClient from "./operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsDashboard() {
  let todoTasks: { id: string; title: string; status: string; priority: string; assignee: string }[] = [];
  let inProgressTasks: { id: string; title: string; status: string; priority: string; assignee: string }[] = [];
  let doneTasks: { id: string; title: string; status: string; priority: string; assignee: string }[] = [];
  let wholesaleClients: { name: string; contact: string; totalOrders: number; revenue: number; interest: string }[] = [];

  let clients: any[] = [];
  let tasks: any[] = [];

  try {
    clients = await db.select().from(wholesaleCustomers);
    tasks = await db.select().from(teamTasks);

    wholesaleClients = clients.map(c => ({
      name: c.storeName || 'ללא שם',
      contact: c.city || 'לא ידוע', // City acts as contact area
      totalOrders: 0,
      revenue: 0,
      interest: c.interest || 'לא צוין'
    }));

    // Mock distribute tasks to columns since we don't have status in db
    tasks.forEach((t, i) => {
      const taskObj = {
        id: t.id,
        title: t.taskDescription || 'משימה ללא כותרת',
        status: 'todo',
        priority: i % 3 === 0 ? 'high' : 'medium',
        assignee: t.assignee || 'כללי'
      };

      if (i % 3 === 0) {
        todoTasks.push(taskObj);
      } else if (i % 3 === 1) {
        inProgressTasks.push(taskObj);
      } else {
        doneTasks.push(taskObj);
      }
    });

  } catch (e) {
    console.error("Database connection failed, using empty data:", e);
  }

  return (
    <OperationsClient 
      todoTasks={todoTasks}
      inProgressTasks={inProgressTasks}
      doneTasks={doneTasks}
      wholesaleClients={wholesaleClients}
      rawWholesaleCustomers={clients}
      rawTeamTasks={tasks}
    />
  );
}
