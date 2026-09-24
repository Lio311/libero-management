'use server'

import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';

export async function toggleGlassThemeAction(newMode: 'light' | 'dark') {
  const user = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  
  if (user?.emailAddresses[0]?.emailAddress !== adminEmail) {
    throw new Error('Unauthorized: Only admin can change the global theme');
  }

  const existing = await db.select().from(settings).where(eq(settings.key, 'glass_theme')).limit(1);
  
  if (existing.length > 0) {
    await db.update(settings).set({ value: newMode }).where(eq(settings.key, 'glass_theme'));
  } else {
    await db.insert(settings).values({ key: 'glass_theme', value: newMode });
  }

  // Revalidate the entire layout so all users get the new theme on navigation/reload
  revalidatePath('/', 'layout');
}
