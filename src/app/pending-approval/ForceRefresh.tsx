'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function ForceRefresh() {
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        await getToken({ skipCache: true });
        if (mounted) {
          router.push('/');
        }
      } catch (err) {
        console.error("Failed to refresh token:", err);
      }
    };
    refresh();
    return () => { mounted = false; };
  }, [getToken, router]);

  return (
    <div className="mt-4 text-emerald-400 text-sm animate-pulse font-medium">
      החשבון אושר! מעביר אותך למערכת...
    </div>
  );
}
