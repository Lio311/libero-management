'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export async function login(token: string) {
  // Check if TOTP is enabled
  const existing = await db.select().from(settings).where(eq(settings.key, 'totp_secret')).limit(1);
  const totpSecret = existing.length > 0 ? existing[0].value : null;

  if (totpSecret) {
    const isValid = authenticator.verify({ token, secret: totpSecret });
    if (!isValid) {
      return { success: false, error: 'קוד שגוי' };
    }
  } else {
    // Fallback if 2FA is not configured yet
    if (token !== '3197') {
      return { success: false, error: 'קוד שגוי' };
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
