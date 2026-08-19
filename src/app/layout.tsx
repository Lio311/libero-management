import type { Metadata, Viewport } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';
const assistant = Assistant({ subsets: ['latin', 'hebrew'] });

export const metadata: Metadata = {
  title: 'Libero Management',
  description: 'B2B/B2C fragrance and decant business management',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

import { cookies } from 'next/headers';
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalNotifications } from "@/components/layout/global-notifications";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL } from '@clerk/localizations';
import { currentUser } from '@clerk/nextjs/server';

import { Toaster } from 'sonner';
import { ConfirmProvider } from '@/hooks/useConfirm';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  const hasFinanceAuth = !!authCookie?.value;

  const user = await currentUser();
  const adminEmail = process.env.admin_email || 'lior31197@gmail.com';
  const isAdmin = user?.emailAddresses[0]?.emailAddress === adminEmail;

  return (
    <ClerkProvider localization={heIL}>
      <html lang="he" dir="rtl">
        <body className={`${assistant.className} antialiased h-screen overflow-hidden flex flex-col md:flex-row`}>
          <ConfirmProvider>
            <LayoutWrapper sidebar={
              <Sidebar isAuthenticated={!!user} isAdmin={isAdmin}>
                <GlobalNotifications />
              </Sidebar>
            }>
              {children}
            </LayoutWrapper>
            <Toaster richColors position="top-center" />
          </ConfirmProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
