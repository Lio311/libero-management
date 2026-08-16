import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('auth');

  if (!authCookie || !authCookie.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_insecure_secret_for_dev_only');
    await jwtVerify(authCookie.value, secret);
    return NextResponse.next();
  } catch (error) {
    console.error('Auth verification failed in proxy:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (auth page)
     * - api/webhooks (public API endpoints)
     * - api/sync (cron sync)
     * - api/qc-sync (cron QC sync)
     * - api/qc-notify (cron QC notify)
     * - api/cron/wholesale-scanner (cron wholesale scanner)
     * - api/cron/generate-qc-report (cron qc report)
     * - api/oded-coupon (public Oded report API)
     * - api/influencer-coupon (public influencer report API)
     * - marketing/oded (public Oded report page)
     * - marketing/influencers (public influencers report page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - libero-d.png (App logo)
     * - oded.png (Oded profile image)
     * - influencers (influencer images)
     * - brands (brand images)
     */
    '/((?!login|api/webhooks|api/sync|api/qc-sync|api/qc-notify|api/cron/wholesale-scanner|api/cron/generate-qc-report|api/oded-coupon|api/influencer-coupon|marketing/oded|marketing/influencers|_next/static|_next/image|favicon.ico|sw.js|manifest.json|libero-d.png|oded.png|influencers|brands).*)',
  ],
};
