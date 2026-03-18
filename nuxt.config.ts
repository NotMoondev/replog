import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    vite: {
        plugins: [
            tailwindcss()
        ]
    },
    modules: ["@pinia/nuxt", "nuxt-lucide-icons"],
    css: ['~/assets/main.css'],
    devtools: { enabled: false },
    lucide: {
        namePrefix: "Icon"
    }
})
