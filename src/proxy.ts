import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function verifyGoogleAuth(request: any) {
  const authCookie = request.cookies.get('auth');
  if (!authCookie || !authCookie.value) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_insecure_secret_for_dev_only');
    await jwtVerify(authCookie.value, secret);
    return true;
  } catch (error) {
    return false;
  }
}

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-up(.*)',
  '/finance-auth(.*)',
  '/setup-2fa(.*)',
  '/api/webhooks(.*)',
  '/api/sync(.*)',
  '/api/qc-sync(.*)',
  '/api/qc-notify(.*)',
  '/api/cron/wholesale-scanner(.*)',
  '/api/cron/generate-qc-report(.*)',
  '/api/lindo-image(.*)',
  '/api/test-catalog(.*)',
  '/api/test-image(.*)',
  '/api/oded-coupon(.*)',
  '/api/influencer-coupon(.*)',
  '/marketing/oded(.*)',
  '/marketing/influencers(.*)',
  '/pending-approval(.*)',
  '/manifest.json'
]);

const isFinanceRoute = createRouteMatcher(['/finance(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect the route with Clerk
  await auth.protect();

  const authData = await auth();
  const userId = authData.userId;
  const sessionClaims = authData.sessionClaims as any;

  if (userId) {
    let isApproved = sessionClaims?.publicMetadata?.isApproved;
    
    // If not approved in the JWT, check if they are the admin
    if (!isApproved) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
        const email = user.emailAddresses[0]?.emailAddress;
        
        if (email === adminEmail) {
          isApproved = true; // Admin bypasses approval
        }
      } catch (error) {
        console.error("Failed to fetch user in middleware:", error);
      }
    }

    if (!isApproved) {
      if (request.nextUrl.pathname !== '/pending-approval') {
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }
    }
  }

  if (isFinanceRoute(request)) {
    const isGoogleAuthenticated = await verifyGoogleAuth(request);
    if (!isGoogleAuthenticated) {
      const url = new URL('/finance-auth', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
