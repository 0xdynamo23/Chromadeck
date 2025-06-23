import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['fabric', '@reduxjs/toolkit'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    // Optimize for Fabric.js and JSZip
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        inherits: false,
        events: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
  images: {
    domains: [],
    unoptimized: true, // For static export compatibility
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
};

export default nextConfig;
