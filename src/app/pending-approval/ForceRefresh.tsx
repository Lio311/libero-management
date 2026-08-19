'use client';

import { useEffect } from 'react';

export function ForceRefresh() {
  useEffect(() => {
    // Small delay to let the server-side approval propagate,
    // then do a full page reload to / so the middleware re-checks
    // against Clerk's backend (not the stale JWT)
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mt-4 text-emerald-400 text-sm animate-pulse font-medium">
      החשבון אושר! מעביר אותך למערכת...
    </div>
  );
}
