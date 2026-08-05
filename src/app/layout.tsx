import type { Metadata, Viewport } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.className} antialiased h-screen overflow-hidden flex`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
