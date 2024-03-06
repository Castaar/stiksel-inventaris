const withPWA = require("next-pwa")({
  dest: "public",
});

module.exports = withPWA({
  // next.js config
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
});
