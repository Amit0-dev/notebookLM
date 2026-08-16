import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // Avoid gzip buffering of SSE/UI message streams proxied through Next.
  compress: false,
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: "/api/billing/:path*",
        destination: `${apiUrl}/api/billing/:path*`,
      },
    ];
  },
};

export default nextConfig;
