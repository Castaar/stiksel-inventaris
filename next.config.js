const isDev = process.env.NODE_ENV !== "production";
// Vercel preview deployments load the Vercel toolbar from vercel.live
const isPreview = process.env.VERCEL_ENV === "preview";
const vercelLive = isPreview ? " https://vercel.live" : "";

// Pages only load their own scripts; __NEXT_DATA__ is JSON and isn't executed.
// The build uses webpack (package.json): a Turbopack build adds an inline bootstrap script that this policy blocks.
// Inline styles are needed for style props and react-hot-toast.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""}${vercelLive}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${vercelLive}`,
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}${vercelLive}`,
  `frame-src 'self'${vercelLive}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Inventory data must never be cached by the browser or a CDN
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // Always fetch the latest service worker
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};
