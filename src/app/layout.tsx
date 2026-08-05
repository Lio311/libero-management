import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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

import { Sidebar } from "@/components/layout/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.className} antialiased h-screen overflow-hidden flex`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </body>
    </html>
  );
}
