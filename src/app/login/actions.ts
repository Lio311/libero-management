'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';
import { SignJWT } from 'jose';

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
    const fallbackPin = process.env.ADMIN_PIN || '3197';
    if (token !== fallbackPin) {
      return { success: false, error: 'קוד שגוי' };
    }
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_insecure_secret_for_dev_only');
  const jwt = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('auth', jwt, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
    sameSite: 'lax'
  });
  return { success: true };
}
