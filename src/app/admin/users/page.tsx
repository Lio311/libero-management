import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import UsersClient from './users-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const admin = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  
  if (admin?.emailAddresses[0]?.emailAddress !== adminEmail) {
    redirect('/');
  }

  const client = await clerkClient();
  const usersResponse = await client.users.getUserList({
    limit: 100,
    orderBy: '-created_at'
  });

  const formattedUsers = usersResponse.data.map(u => ({
    id: u.id,
    email: u.emailAddresses[0]?.emailAddress || '',
    firstName: u.firstName,
    lastName: u.lastName,
    imageUrl: u.imageUrl,
    createdAt: u.createdAt,
    isApproved: !!u.publicMetadata?.isApproved,
    role: (u.publicMetadata?.role as string) || 'user',
  }));

  return <UsersClient users={formattedUsers} adminEmail={adminEmail} />;
}
