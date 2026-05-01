import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'; // Bunu ekleyin

export default defineConfig({
    plugins: [
        react(),
        // tailwindcss() kaldýr - postcss üzerinden çalýþýr
        VitePWA({ registerType: 'autoUpdate' }) // Bunu ekleyin
    ],
})