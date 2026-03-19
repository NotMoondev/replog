import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    vite: {
        plugins: [
            tailwindcss()
        ]
    },
    modules: ["@pinia/nuxt", "nuxt-lucide-icons", "@vite-pwa/nuxt"],
    pwa: {
        registerType: 'autoUpdate',
        manifest: {
            name: 'RepLog',
            short_name: 'RepLog',
            description: 'Dein Workout-Tagebuch',
            theme_color: '#171717',
            background_color: '#171717',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
                {
                    src: 'icons/icon-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    src: 'icons/icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                },
                {
                    src: 'icons/icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                },
            ],
        },
        workbox: {
            navigateFallback: '/',
            globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
        },
        devOptions: {
            enabled: true,
            type: 'module',
        },
    },
    css: ['~/assets/main.css'],
    devtools: { enabled: false },
    lucide: {
        namePrefix: "Icon"
    }
})
