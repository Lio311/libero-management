'use server';

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// We can temporarily store the secret in memory during setup, 
// or pass it back to the client to send back upon verification.
// Since we don't have sessions, passing it to the client is easier (though less secure in a real app, it's fine here for a one-time admin setup).

export async function generateSetupCode() {
  // Check if it's already set up
  const existing = await db.select().from(settings).where(eq(settings.key, 'totp_secret')).limit(1);
  if (existing.length > 0 && existing[0].value) {
    return { error: '2FA is already set up for this site.' };
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri('Admin', 'Libero Management', secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  return { secret, qrCodeUrl };
}

export async function verifyAndSaveSecret(secret: string, token: string) {
  try {
    const isValid = authenticator.verify({ token, secret });
    
    if (isValid) {
      // Save the secret to the DB
      await db.insert(settings).values({
        key: 'totp_secret',
        value: secret
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: secret }
      });
      return { success: true };
    } else {
      return { success: false, error: 'קוד שגוי. נסה שוב.' }; // Incorrect code. Try again.
    }
  } catch (error) {
    return { success: false, error: 'אירעה שגיאה. נסה שוב.' };
  }
}
