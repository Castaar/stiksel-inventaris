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
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  let ip;
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // The LAST IP before Vercel is usually the real client IP when behind Cloudflare
    // But we need to check all IPs in the chain
    const ips = forwarded.split(',').map(ip => ip.trim());
    
    // Log all IPs in the chain for debugging
    console.log('x-forwarded-for chain:', ips);
    console.log('x-real-ip:', realIp);
    
    // Check if ANY IP in the forwarded chain is whitelisted
    // This handles cases where the client IP might be at different positions
    const whitelistedIp = ips.find(forwardedIp => 
      WHITELISTED_IPS.some(allowedIp => forwardedIp === allowedIp)
    );
    
    if (whitelistedIp) {
      console.log('Whitelisted IP found in chain:', whitelistedIp);
      return NextResponse.next();
    }
    
    // Use the first IP for logging (original client)
    ip = ips[0];
  } else {
    ip = realIp || '127.0.0.1';
  }
  
  // If we get here, no whitelisted IP was found
  console.log('Access denied - no whitelisted IP found');
  console.log('Client IP:', ip);
  
  // Allow access to the 403 page itself to avoid redirect loop
  if (request.nextUrl.pathname === '/403') {
    return NextResponse.next();
  }
  
  // Redirect to 403 page with IP info
  const url = new URL('/403', request.url);
  url.searchParams.set('ip', ip);
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|fonts/|manifest.json|robots.txt|sw.js).*)',
  ],
};
