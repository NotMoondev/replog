import tailwindcss from "@tailwindcss/vite";

const rawBaseURL = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.NUXT_APP_BASE_URL ?? "/";
const baseURL = `/${rawBaseURL.replace(/^\/+|\/+$/g, "")}/`.replace("//", "/");

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    app: {
        baseURL,
        head: {
            link: [
                { rel: 'icon', type: 'image/x-icon', href: `${baseURL}favicon.ico` },
                { rel: 'shortcut icon', type: 'image/x-icon', href: `${baseURL}favicon.ico` },
                { rel: 'apple-touch-icon', href: `${baseURL}icons/icon-192x192.png` },
            ],
        },
    },
    vite: {
        plugins: [
            tailwindcss()
        ]
    },
    modules: ["@pinia/nuxt", "nuxt-lucide-icons", "@vite-pwa/nuxt"],
    pwa: {
        base: baseURL,
        registerType: 'autoUpdate',
        manifest: {
            name: 'REPLOG',
            short_name: 'RL',
            description: 'Dein Workout-Tagebuch',
            theme_color: '#171717',
            background_color: '#171717',
            display: 'standalone',
            orientation: 'portrait',
            start_url: baseURL,
            scope: baseURL,
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
            navigateFallback: baseURL,
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
