'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export async function login(password: string, token?: string) {
  if (password !== '3197') {
    return { success: false, error: 'Incorrect password' };
  }

  // Check if TOTP is enabled
  const existing = await db.select().from(settings).where(eq(settings.key, 'totp_secret')).limit(1);
  const totpSecret = existing.length > 0 ? existing[0].value : null;

  if (totpSecret) {
    if (!token) {
      return { success: false, requireTotp: true };
    }
    
    const isValid = authenticator.verify({ token, secret: totpSecret });
    if (!isValid) {
      return { success: false, error: 'קוד מאמת שגוי' }; // Incorrect authenticator code
    }
  }

  const cookieStore = await cookies();
  cookieStore.set('auth', 'authenticated', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/'
  });
  return { success: true };
}
