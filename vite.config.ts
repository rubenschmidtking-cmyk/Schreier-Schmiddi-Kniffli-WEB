import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'sounds/dice-roll.mp3', 'sounds/score-lock.mp3'],
      manifest: {
        name: 'Schmiddi & Schreier Spezial',
        short_name: 'S&S Spezial',
        description: 'Schmiddi & Schreier Spezial – das Würfelspiel für 2–4 iPhones, Pass & Play oder gegen Schmiddi CPU.',
        theme_color: '#06366f',
        background_color: '#031b38',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}']
      }
    })
  ]
})
