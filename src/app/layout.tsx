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

import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalNotifications } from "@/components/layout/global-notifications";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.className} antialiased h-screen overflow-hidden flex`}>
        <LayoutWrapper sidebar={
          <Sidebar>
            <GlobalNotifications />
          </Sidebar>
        }>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
