import { NextResponse } from 'next/server';

// Add your whitelisted IP addresses here
const WHITELISTED_IPS = [
  '213.214.40.251', // CASTAAR IP
  '94.224.96.186', // STIKSEL IP
  '109.128.14.194', // JONAS THUIS IP
  '109.137.150.164', // WOUTER THUIS IP
  '::1', // localhost IPv6
  '127.0.0.1', // localhost IPv4
];

export function middleware(request) {
  // TEMPORARY: Disable IP check - REMOVE THIS AFTER DEBUGGING
  // return NextResponse.next();
  
  // Allow access to the 403 page itself to avoid redirect loop
  if (request.nextUrl.pathname === '/403') {
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
  
  // Log all headers for debugging
  console.log('=== IP WHITELIST CHECK ===');
  console.log('CF-Connecting-IP:', cfConnectingIp);
  console.log('X-Forwarded-For:', forwarded);
  console.log('X-Real-IP:', realIp);
  console.log('Client IP (resolved):', clientIp);
  
  // Check if IP is whitelisted
  const isWhitelisted = WHITELISTED_IPS.includes(clientIp);
  
  if (isWhitelisted) {
    console.log('✅ Access granted for IP:', clientIp);
    return NextResponse.next();
  }
  
  // Access denied
  console.log('❌ Access denied for IP:', clientIp);
  console.log('Whitelisted IPs:', WHITELISTED_IPS);
  
  // Redirect to 403 page with IP info
  const url = new URL('/403', request.url);
  url.searchParams.set('ip', clientIp);
  return NextResponse.redirect(url);
}

// Configure which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, icons, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)|icons|images|fonts|manifest.json|robots.txt|sw.js|workbox).*)',
  ],
};
