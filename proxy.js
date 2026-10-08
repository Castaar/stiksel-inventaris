import { NextResponse } from 'next/server';
import { SESSION_COOKIE, authConfigured, verifySessionToken } from './lib/auth';

// Whitelisted IPs: set ALLOWED_IPS (comma separated) in the environment.
// The list below is only a fallback so the existing deployment keeps working.
const FALLBACK_IPS = [
  '213.214.40.251', // Castaar
  '94.224.96.186', // Stiksel
];

const ALLOWED_IPS = process.env.ALLOWED_IPS
  ? process.env.ALLOWED_IPS.split(',').map((ip) => ip.trim()).filter(Boolean)
  : FALLBACK_IPS;

const IS_DEV = process.env.NODE_ENV !== 'production';

// Constant-time string comparison (crypto.timingSafeEqual isn't available on the edge runtime)
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// The client IP.
// With CF_ORIGIN_SECRET set, CF-Connecting-IP is only trusted when Cloudflare also
// sends that secret as "x-origin-secret" (add it with a Cloudflare Transform Rule).
// Without it, the headers can be spoofed by anyone who reaches the origin directly,
// so set CF_ORIGIN_SECRET in production.
function getClientIp(request) {
  const cfSecret = process.env.CF_ORIGIN_SECRET;
  if (cfSecret && !safeEqual(request.headers.get('x-origin-secret') || '', cfSecret)) {
    return null;
  }
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
  return ip ? ip.split(',')[0].trim() : null;
}

// Block cross-site requests to mutating API routes (CSRF)
function isCrossSiteMutation(request) {
  if (!request.nextUrl.pathname.startsWith('/api/')) return false;
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;

  if (request.headers.get('sec-fetch-site') === 'cross-site') return true;
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const hosts = [request.headers.get('host'), request.headers.get('x-forwarded-host'), request.nextUrl.host];
      return !hosts.includes(originHost);
    } catch {
      return true;
    }
  }
  return false;
}

// Reachable without a session (still behind the IP whitelist)
const LOGIN_PATHS = ['/login', '/api/login'];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Public: the access denied page and the status check for uptime monitoring
  if (['/403', '/api/health'].includes(pathname)) return NextResponse.next();

  const clientIp = getClientIp(request);
  const ipAllowed = IS_DEV || (clientIp !== null && ALLOWED_IPS.includes(clientIp));
  if (!ipAllowed) {
    const url = new URL('/403', request.url);
    if (clientIp) url.searchParams.set('ip', clientIp);
    return NextResponse.redirect(url);
  }

  // Login with a password once APP_PASSWORD and AUTH_SECRET are set; until then only the IP whitelist protects the app
  if (authConfigured() && !LOGIN_PATHS.includes(pathname)) {
    const loggedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!loggedIn) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
      }
      const url = new URL('/login', request.url);
      const next = pathname + request.nextUrl.search;
      if (next !== '/') url.searchParams.set('next', next);
      return NextResponse.redirect(url);
    }
  }

  if (isCrossSiteMutation(request)) {
    return NextResponse.json({ error: 'Cross-site request blocked' }, { status: 403 });
  }

  return NextResponse.next();
}

// Static assets don't need the check
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images/|icons/|fonts/|favicon|manifest.json|robots.txt|sw.js).*)',
  ],
};
