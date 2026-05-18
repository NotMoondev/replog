<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useActiveSession } from '~/composables/useActiveSession'

const router = useRouter()
const route = useRoute()
const activeSession = useActiveSession()

const ROUTE_TITLES: Record<string, string> = {
    '/exercises': 'Übungen',
    '/workouts': 'Workouts',
    '/plan': 'Trainingsplan',
    '/stats': 'Statistiken',
    '/session': 'Training',
    '/settings': 'Einstellungen',
}

const routeTitle = computed(() => {
    const match = Object.entries(ROUTE_TITLES).find(([prefix]) => route.path.startsWith(prefix))
    return match ? match[1] : 'Start'
})

const isSession = computed(() => route.path.startsWith('/session'))

// Extra padding when resume banner is visible (banner ~44px + gap 8px)
const mainPaddingClass = computed(() => {
    if (isSession.value) return 'pb-4'
    return activeSession.isActive.value ? 'pb-40' : 'pb-24'
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
        <main class="flex-1 overflow-y-auto" :class="mainPaddingClass">
            <slot />
        </main>
    </div>
    <BottomNav />
    <ToastContainer />
</template>

