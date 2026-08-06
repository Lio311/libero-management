import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');

  if (!authCookie || authCookie.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (auth page)
     * - api/webhooks (public API endpoints)
     * - api/oded-coupon (public Oded report API)
     * - marketing/oded (public Oded report page)
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
    '/((?!login|api/webhooks|api/oded-coupon|api/influencer-coupon|marketing/oded|marketing/influencers|_next/static|_next/image|favicon.ico|sw.js|manifest.json|libero-d.png|oded.png|influencers|brands).*)',
  ],
};
