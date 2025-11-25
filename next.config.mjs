/** @type {import('next').NextConfig} */

import setupPWA from 'next-pwa';

const isDev = process.env.NODE_ENV === 'development';

const baseConfig = {
  // dev'de strict mode kapalı, prod'da açık
  reactStrictMode: !isDev,
};

const withPWA = !isDev
  ? setupPWA({
        dest: 'public',
        disable: false,
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
            },
          },
        ],
      })
  : (config) => config;

export default withPWA(baseConfig);
