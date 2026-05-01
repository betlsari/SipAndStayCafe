import { useEffect } from 'react'

export function useRegisterSW() {
    useEffect(() => {
        if (typeof window === 'undefined') return

        // vite-plugin-pwa virtual module — yalnýzca prod build'de mevcuttur.
        // Dynamic import ile dev ortamýnda sessizce atlanýr.
        import('virtual:pwa-register')
            .then(({ registerSW }) => {
                registerSW({
                    onNeedRefresh() {
                        // Yeni SW bulundu — sessiz güncelleme (networkFirst stratejisi)
                        console.info('[PWA] New content available, updating…')
                    },
                    onOfflineReady() {
                        console.info('[PWA] App ready to work offline.')
                    },
                })
            })
            .catch(() => {
                // Dev ortamýnda virtual modül yok — normal
            })
    }, [])
}