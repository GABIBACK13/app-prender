import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5177,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'icons.svg', 'apple-touch-icon-180x180.png'],
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Apprender',
        short_name: 'Apprender',
        description: 'Aprenda com diversão e ganhe recompensas!',
        theme_color: '#1565C0',
        background_color: '#E3F2FD',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'game'],
        icons: [
          { src: 'pwa-64x64.png',             sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',            sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',            sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg',               sizes: 'any',     type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
})
