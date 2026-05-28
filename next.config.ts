import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes intentionally off — pages use dynamic query-string hrefs that
  // typedRoutes flags as false positives. Revisit when migrating to typed URL helpers.
  typedRoutes: false,
  async redirects() {
    // Permanent redirect from the old Vercel preview domain to the canonical
    // custom domain. Keeps any old links / shared screenshots working and
    // consolidates SEO signal on abkonservices.com.ng.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "abkon-laundromat.vercel.app" }],
        destination: "https://abkonservices.com.ng/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
