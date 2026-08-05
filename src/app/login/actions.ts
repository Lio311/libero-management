'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(password: string) {
  if (password === '3197') {
    const cookieStore = await cookies();
    cookieStore.set('auth', 'authenticated', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });
    return { success: true };
  }
  return { success: false, error: 'Incorrect password' };
}
