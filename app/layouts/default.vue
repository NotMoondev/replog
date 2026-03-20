<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const routeTitle = computed(() => {
    if (route.path.startsWith('/workouts')) return 'Workouts'
    if (route.path.startsWith('/plan')) return 'Trainingsplan'
    if (route.path.startsWith('/stats')) return 'Statistiken'
    if (route.path.startsWith('/session')) return 'Training'
    if (route.path.startsWith('/settings')) return 'Einstellungen'
    return 'Start'
})

function goBack() {
    router.back()
}
</script>

<template>
    <div class="h-screen bg-bg text-text flex flex-col">
        <!-- Top Bar -->
        <header
            v-if="route.path !== '/'"
            class="flex items-center justify-between bg-card border-b border-border px-4 py-3"
        >
            <button @click="goBack" class="flex items-center w-16">
                <IconArrowLeft class="size-5 text-text" />
            </button>

            <div class="text-base font-semibold text-center flex-1">
                {{ routeTitle }}
            </div>

            <div class="w-16 flex justify-end">
                <NuxtLink
                    v-if="route.path === '/settings'"
                    to="/"
                    class="text-text-muted hover:text-text p-1"
                >
                </NuxtLink>
            </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto pb-20">
            <slot />
        </main>
    </div>
    <BottomNav />
    <ToastContainer />
</template>

