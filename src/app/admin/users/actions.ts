'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, role: 'unapproved' | 'user' | 'warehouse') {
  const admin = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  if (admin?.emailAddresses[0]?.emailAddress !== adminEmail) {
    throw new Error('Unauthorized');
  }

  const client = await clerkClient();
  
  const isApproved = role !== 'unapproved';
  const assignedRole = role === 'unapproved' ? 'user' : role;
  
  // Update the user's metadata
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { isApproved, role: assignedRole }
  });

  // Verify the update actually took effect
  const updatedUser = await client.users.getUser(userId);
  const actualStatus = !!updatedUser.publicMetadata?.isApproved;
  const actualRole = updatedUser.publicMetadata?.role;
  
  if (actualStatus !== isApproved || actualRole !== assignedRole) {
    console.error(`updateUserRole FAILED: expected isApproved=${isApproved} role=${assignedRole}, got isApproved=${actualStatus} role=${actualRole} for user ${userId}`);
    throw new Error('Failed to update user role');
  }

  console.log(`updateUserRole SUCCESS: user ${userId} isApproved=${actualStatus} role=${actualRole}`);

  revalidatePath('/admin/users');
}
