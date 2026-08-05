'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/sidebar";
import { GlobalNotifications } from "@/components/layout/global-notifications";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname === '/setup-2fa') {
    return (
      <main className="flex-1 w-full h-screen bg-black overflow-y-auto">
        {children}
      </main>
    );
  }

  return (
    <>
      <Sidebar>
        <GlobalNotifications />
      </Sidebar>
      <main className="flex-1 overflow-y-auto bg-muted/20 page-animate">
        {children}
      </main>
    </>
  );
}
