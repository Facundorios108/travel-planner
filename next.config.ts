import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  // Optimización para Cloudflare Pages
  output: 'standalone',
  // Configuración de imágenes para Cloudflare
  images: {
    unoptimized: true,
  },
  // Configuración para PWA
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
