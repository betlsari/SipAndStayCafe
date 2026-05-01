import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'SipAndStay Cafe',
                short_name: 'SipAndStay',
                description: 'QR tabanlý kafe sipariþ sistemi',
                theme_color: '#09090b',
                background_color: '#09090b',
                display: 'standalone',
                scope: '/',
                start_url: '/menu',
                icons: [
                    {
                        src: 'favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) =>
                            ['/menu', '/order-status', '/payment', '/payment-result'].some(
                                (p) => url.pathname.startsWith(p),
                            ),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'customer-pages',
                            networkTimeoutSeconds: 5,
                        },
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/menu'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'menu-api',
                            networkTimeoutSeconds: 5,
                        },
                    },
                ],
            },
        }),
    ],
})