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
};

import { cookies } from 'next/headers';
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalNotifications } from "@/components/layout/global-notifications";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.className} antialiased h-screen overflow-hidden flex flex-col md:flex-row`}>
        <LayoutWrapper sidebar={
          <Sidebar isAuthenticated={isAuthenticated}>
            <GlobalNotifications />
          </Sidebar>
        }>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
