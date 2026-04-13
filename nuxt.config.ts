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
            meta: [ 
                { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }, 
            ],
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
        scope: baseURL,
        registerType: 'autoUpdate',
        manifest: {
            name: 'REPLOG',
            short_name: 'REPLOG',
            description: 'Dein Workout-Tagebuch',
            theme_color: '#171717',
            background_color: '#171717',
            display: 'standalone',
            orientation: 'portrait',
            start_url: baseURL,
            scope: baseURL,
            categories: ['fitness', 'productivity'],
            screenshots: [
                {
                    src: 'screenshot-645x1398.webp',
                    sizes: '645x1398',
                    type: 'image/webp',
                },
                {
                    src: 'icons/icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    form_factor: 'wide',
                },
            ],
            icons: [
                {
                    src: 'icons/icon-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                },
                {
                    src: 'icons/icon-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                },
                {
                    src: 'icons/icon-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'maskable',
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
            navigateFallback: `${baseURL}index.html`,
            navigateFallbackDenylist: [/^\/api\//],
            globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2,webp}'],
        },
        devOptions: {
            enabled: true,
            type: 'module',
            },
        client: {
            installPrompt: true,
            periodicSyncForUpdates: 3600,
        },
        registerWebManifestInRouteRules: true,
    },
    css: ['~/assets/main.css'],
    devtools: { enabled: false },
    lucide: {
        namePrefix: "Icon"
    }
})
