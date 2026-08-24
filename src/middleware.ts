import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const res = NextResponse.next();

    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    const csp = [
      "default-src 'self'",
      "script-src 'self' https://apis.google.com https://accounts.google.com",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://accounts.google.com https://www.googleapis.com",
      'frame-src https://accounts.google.com',
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    res.headers.set('Content-Security-Policy', csp);

    return res;
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public API surface
        if (path.startsWith('/api/auth') || path === '/api/health') {
          return true;
        }

        // All other APIs default-deny: require an authenticated session.
        if (path.startsWith('/api/')) {
          return !!token;
        }

        if (path === '/login' || path === '/signup' || path === '/onboarding' || path === '/') {
          return true;
        }

        if (
          path.startsWith('/dashboard') ||
          path.startsWith('/calendar') ||
          path.startsWith('/inbox') ||
          path.startsWith('/planner') ||
          path.startsWith('/focus') ||
          path.startsWith('/soundscape') ||
          path.startsWith('/insights') ||
          path.startsWith('/settings') ||
          path.startsWith('/student') ||
          path.startsWith('/freelancer') ||
          path.startsWith('/professional') ||
          path.startsWith('/founder')
        ) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/calendar/:path*',
    '/inbox/:path*',
    '/planner/:path*',
    '/focus/:path*',
    '/soundscape/:path*',
    '/insights/:path*',
    '/settings/:path*',
    '/student/:path*',
    '/freelancer/:path*',
    '/professional/:path*',
    '/founder/:path*',
    '/api/:path*',
  ],
};
