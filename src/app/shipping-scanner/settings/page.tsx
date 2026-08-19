import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getScannerSettings } from '@/app/actions/scanner-actions';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function ScannerSettingsPage() {
  const admin = await currentUser();
  const adminEmail = process.env.admin_email || 'lior31197@gmail.com';
  
  if (admin?.emailAddresses[0]?.emailAddress !== adminEmail) {
    redirect('/shipping-scanner');
  }

  const keywords = await getScannerSettings();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 h-screen overflow-y-auto w-full">
      <SettingsClient initialKeywords={keywords} />
    </div>
  );
}
