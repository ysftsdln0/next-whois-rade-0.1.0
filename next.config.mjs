/** @type {import('next').NextConfig} */

import setupPWA from 'next-pwa';

// Alt dizinde çalıştırmak için basePath ayarı
// Örnek: /whois-rade altında çalışacaksa '/whois-rade' yazın
// Ana dizinde çalışacaksa '' (boş string) bırakın
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  basePath: basePath,
  assetPrefix: basePath,
};

const withPWA = setupPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    buildExcludes: [/manifest\.json$/, /_next\/data/, /_next\/static/],
    runtimeCaching: [
      // cache *.css, *.js, *.woff2 files
      {
        urlPattern: /^https?.*\.(css|js|woff2)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'assets-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        }
      },
    ],
});

export default withPWA(nextConfig);
