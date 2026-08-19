'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function toggleUserApproval(userId: string, isApproved: boolean) {
  const admin = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  if (admin?.emailAddresses[0]?.emailAddress !== adminEmail) {
    throw new Error('Unauthorized');
  }

  const client = await clerkClient();
  
  // Update the user's metadata
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { isApproved }
  });

  // Verify the update actually took effect
  const updatedUser = await client.users.getUser(userId);
  const actualStatus = !!updatedUser.publicMetadata?.isApproved;
  
  if (actualStatus !== isApproved) {
    console.error(`toggleUserApproval FAILED: expected isApproved=${isApproved}, got ${actualStatus} for user ${userId}`);
    throw new Error('Failed to update user approval status');
  }

  console.log(`toggleUserApproval SUCCESS: user ${userId} (${updatedUser.emailAddresses[0]?.emailAddress}) isApproved=${actualStatus}`);

  revalidatePath('/admin/users');
}
