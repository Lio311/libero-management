'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function toggleUserApproval(userId: string, isApproved: boolean) {
  const admin = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  if (admin?.emailAddresses[0]?.emailAddress !== adminEmail) {
    throw new Error('Unauthorized');
  }

  await (await clerkClient()).users.updateUserMetadata(userId, {
    publicMetadata: { isApproved }
  });

  revalidatePath('/admin/users');
}
