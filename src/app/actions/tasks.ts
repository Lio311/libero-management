'use server';

import { db } from '@/lib/db';
import { tasks, taskInstances, categories } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

export async function getCategories() {
  return await db.select().from(categories);
}

export async function createCategory(name: string, color: string) {
  await db.insert(categories).values({ name, color });
  revalidatePath('/');
}

export async function getTasksForMonth(year: number, month: number) {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(startDate);

  // Here we would join taskInstances and tasks
  const data = await db.query.taskInstances.findMany({
    where: and(
      gte(taskInstances.dueDate, format(startDate, 'yyyy-MM-dd')),
      lte(taskInstances.dueDate, format(endDate, 'yyyy-MM-dd'))
    ),
    with: {
      task: {
        with: {
          category: true
        }
      }
    }
  });

  return data;
}

export async function createTask(data: { title: string; description?: string; categoryId: string; isRecurring: boolean; recurrenceDay?: number; date?: string }) {
  const [newTask] = await db.insert(tasks).values({
    title: data.title,
    description: data.description,
    categoryId: data.categoryId,
    isRecurring: data.isRecurring,
    recurrenceDay: data.recurrenceDay,
  }).returning();

  if (!data.isRecurring && data.date) {
    await db.insert(taskInstances).values({
      taskId: newTask.id,
      dueDate: data.date,
    });
  } else if (data.isRecurring && data.recurrenceDay) {
    // Generate instances for the current and next month
    const currentDate = new Date();
    for (let i = 0; i < 2; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, data.recurrenceDay);
      await db.insert(taskInstances).values({
        taskId: newTask.id,
        dueDate: format(targetDate, 'yyyy-MM-dd'),
      });
    }
  }

  revalidatePath('/');
}

export async function toggleTaskCompletion(instanceId: string, isCompleted: boolean) {
  await db.update(taskInstances)
    .set({ 
      isCompleted, 
      completedAt: isCompleted ? new Date() : null 
    })
    .where(eq(taskInstances.id, instanceId));
  
  revalidatePath('/');
}
