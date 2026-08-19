'use client';

import { useClerk } from '@clerk/nextjs';

export function CustomSignOutButton() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/login' });
    } catch (e) {
      // Fallback: force redirect if Clerk sign-out fails
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full bg-zinc-900/50 border border-white/10 hover:bg-white/10 hover:border-white/30 rounded-xl py-3 text-white transition-all duration-300 cursor-pointer font-medium"
    >
      התנתק
    </button>
  );
}
