'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';
import { SignJWT } from 'jose';

// In-memory rate limiting map
const rateLimitMap = new Map<string, { attempts: number, lastAttempt: number }>();

export async function login(token: string) {
  // Artificial delay to mitigate rapid brute-force attacks
  await new Promise(resolve => setTimeout(resolve, 1000));

  const identifier = 'global_login';
  const now = Date.now();
  const rateLimit = rateLimitMap.get(identifier) || { attempts: 0, lastAttempt: now };
  
  // Reset attempts after 5 minutes
  if (now - rateLimit.lastAttempt > 5 * 60 * 1000) {
    rateLimit.attempts = 0;
  }
  
  if (rateLimit.attempts >= 30) {
    return { success: false, error: 'יותר מדי ניסיונות. נסה שוב בעוד 5 דקות.' };
  }
  
  rateLimit.lastAttempt = now;
  rateLimitMap.set(identifier, rateLimit);

  // Check if TOTP is enabled
  const existing = await db.select().from(settings).where(eq(settings.key, 'totp_secret')).limit(1);
  const totpSecret = existing.length > 0 ? existing[0].value : null;

  if (totpSecret) {
    const isValid = authenticator.verify({ token, secret: totpSecret });
    if (!isValid) {
      rateLimit.attempts++;
      return { success: false, error: 'קוד שגוי' };
    }
  } else {
    // Fallback if 2FA is not configured yet
    const fallbackPin = process.env.ADMIN_PIN || '3197';
    if (token !== fallbackPin) {
      rateLimit.attempts++;
      return { success: false, error: 'קוד שגוי' };
    }
  }

  // Reset on successful login
  rateLimit.attempts = 0;
  rateLimitMap.set(identifier, rateLimit);

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
