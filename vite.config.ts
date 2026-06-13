import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/game-tilematch/',
  server: {
    port: 5175,
    strictPort: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        id: '/game-tilematch/',
        name: 'Tile Match',
        short_name: 'TileMatch',
        description: 'Swap tiles, match colors, beat the score goal.',
        theme_color: '#1e2a3a',
        background_color: '#1e2a3a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/game-tilematch/',
        scope: '/game-tilematch/',
        categories: ['games'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/game-tilematch/index.html',
        navigateFallbackDenylist: [/\/levels\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/levels/') && url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'level-packs',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
