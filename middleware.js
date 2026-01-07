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
  // Get the IP address from the request
  // On Vercel, x-forwarded-for contains the real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // Extract IP address (handle multiple IPs in x-forwarded-for)
  let ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  
  // Fallback to localhost if no IP is found (development)
  if (!ip) {
    ip = '127.0.0.1';
  }
  
  // Log the IP for debugging (visible in Vercel logs)
  console.log('Incoming request from IP:', ip);
  console.log('x-forwarded-for:', forwarded);
  console.log('x-real-ip:', realIp);
  
  // Check if IP is whitelisted
  const isWhitelisted = WHITELISTED_IPS.some(whitelistedIp => {
    return ip === whitelistedIp || ip.includes(whitelistedIp);
  });
  
  // If IP is not whitelisted, redirect to 403 page
  if (!isWhitelisted) {
    // Allow access to the 403 page itself to avoid redirect loop
    if (request.nextUrl.pathname === '/403') {
      return NextResponse.next();
    }
    
    console.log('Access denied for IP:', ip);
    // Redirect to 403 page with IP info
    const url = new URL('/403', request.url);
    url.searchParams.set('ip', ip);
    return NextResponse.redirect(url);
  }
  
  // If whitelisted, continue to the requested page
  return NextResponse.next();
}

// Configure which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|fonts/|manifest.json|robots.txt|sw.js).*)',
  ],
};
