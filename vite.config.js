import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'AI Skincare - Bác sĩ Da Liễu Ảo',
        short_name: 'AI Skincare',
        description: 'Bóc tách sự thật bảng thành phần mỹ phẩm bằng AI',
        theme_color: '#1a1417',
        background_color: '#1a1417',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
