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
  '/api/lionwheel/proxy-pdf(.*)',
  '/api/lionwheel/auto-print(.*)',
  '/api/cron/wholesale-scanner(.*)',
  '/api/cron/generate-qc-report(.*)',
  '/api/lindo-image(.*)',
  '/api/test-catalog(.*)',
  '/api/test-image(.*)',
  '/api/oded-coupon(.*)',
  '/api/influencer-coupon(.*)',
  '/api/remote-print(.*)',
  '/api/daemon-script(.*)',
  '/shipping-scanner/bulk-mini-perfume(.*)',
  '/marketing/oded(.*)',
  '/marketing/influencers(.*)',
  '/manifest.json',
  '/api/debug-wc(.*)'
]);

const isFinanceRoute = createRouteMatcher(['/finance(.*)']);
const isPendingApprovalRoute = createRouteMatcher(['/pending-approval(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Fully public routes — no auth needed at all
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // pending-approval: let it through but don't require auth
  if (isPendingApprovalRoute(request)) {
    return NextResponse.next();
  }

  // All other routes require authentication
  await auth.protect();

  const authData = await auth();
  const userId = authData.userId;
  const sessionClaims = authData.sessionClaims as any;

  if (userId) {
    let isApproved = sessionClaims?.publicMetadata?.isApproved;
    let role = sessionClaims?.publicMetadata?.role;
    
    // If not approved in the JWT, check the actual Clerk backend data
    // (the JWT may be stale after admin approves a user)
    if (!isApproved) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
        const email = user.emailAddresses[0]?.emailAddress;
        
        const approvedInBackend = !!user.publicMetadata?.isApproved;
        const isAdmin = email === adminEmail;
        
        role = user.publicMetadata?.role || 'user';
        
        console.log(`[Middleware] User ${email} (${userId}): JWT.isApproved=${sessionClaims?.publicMetadata?.isApproved}, Backend.isApproved=${approvedInBackend}, isAdmin=${isAdmin}, role=${role}`);
        
        if (isAdmin || approvedInBackend) {
          isApproved = true;
        }
      } catch (error) {
        console.error("[Middleware] Failed to fetch user from Clerk:", error);
      }
    }

    if (!isApproved) {
      if (request.nextUrl.pathname !== '/pending-approval') {
        console.log(`[Middleware] Redirecting unapproved user ${userId} to /pending-approval`);
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }
    } else {
      // User is approved. Restrict warehouse role.
      if (role === 'warehouse') {
        const isShippingScannerRoute = request.nextUrl.pathname.startsWith('/shipping-scanner');
        if (!isShippingScannerRoute && request.nextUrl.pathname !== '/pending-approval') {
          console.log(`[Middleware] Redirecting warehouse user ${userId} to /shipping-scanner from ${request.nextUrl.pathname}`);
          return NextResponse.redirect(new URL('/shipping-scanner', request.url));
        }
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
