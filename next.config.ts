import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'libero-il.co.il',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.libero-il.co.il',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
