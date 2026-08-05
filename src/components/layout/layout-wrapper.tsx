'use client';

import { usePathname } from 'next/navigation';

export function LayoutWrapper({ children, sidebar }: { children: React.ReactNode, sidebar: React.ReactNode }) {
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
      {sidebar}
      <main className="flex-1 overflow-y-auto bg-muted/20 page-animate">
        {children}
      </main>
    </>
  );
}
