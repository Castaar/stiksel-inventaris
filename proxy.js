import { NextResponse } from 'next/server';

// Add your whitelisted IP addresses here
const WHITELISTED_IPS = [
  '213.214.40.251', // CASTAAR IP
  '94.224.96.186', // STIKSEL IP
  '::1', // localhost IPv6
  '127.0.0.1', // localhost IPv4
];

export function proxy(request) {
  const pathname = request.nextUrl.pathname;
  
  // FIRST: Skip ALL static files and assets - do this before ANY other checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/public') ||
    pathname.includes('workbox') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sw.js' ||
    pathname === '/403' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.map')
  ) {
    return NextResponse.next();
  }
  
  // Get the REAL client IP - Cloudflare sends this in CF-Connecting-IP
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // Cloudflare's CF-Connecting-IP is the most reliable for real client IP
  let clientIp = cfConnectingIp;
  
  if (!clientIp && forwarded) {
    // Fallback: first IP in x-forwarded-for chain
    clientIp = forwarded.split(',')[0].trim();
  }
  
  if (!clientIp) {
    clientIp = realIp || '127.0.0.1';
  }
  
  // Check if IP is whitelisted
  const isWhitelisted = WHITELISTED_IPS.includes(clientIp);
  
  if (isWhitelisted) {
    return NextResponse.next();
  }
  
  // Redirect to 403 page with IP info
  const url = new URL('/403', request.url);
  url.searchParams.set('ip', clientIp);
  return NextResponse.redirect(url);
}

// Configure which routes the proxy runs on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image).*)',
  ],
};
