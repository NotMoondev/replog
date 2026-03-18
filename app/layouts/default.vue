<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const routeTitle = computed(() => {
    if (route.path.startsWith('/workouts')) return 'Workouts'
    if (route.path.startsWith('/plan')) return 'Trainingsplan'
    if (route.path.startsWith('/stats')) return 'Statistiken'
    return 'Start'
})

function goBack() {
    router.back()
}
</script>

<template>
    <div class="h-screen bg-bg text-text flex flex-col">
        <!-- Top Bar -->
        <header class="flex items-center justify-between bg-card border-b border-border px-4 py-3 shadow-sm" v-if="route.path !== '/'">
            <button v-if="route.path !== '/'" @click="goBack"
                class="text-primary-500 hover:text-primary-400 flex items-center gap-1 w-20">
                <IconArrowLeft :size="32" class="text-white" />
            </button>

            <div class="text-lg font-semibold text-center flex-1">
                {{ routeTitle }}
            </div>

            <!-- Platzhalter für Right Actions -->
            <div class="w-20"></div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto">
            <slot />
        </main>
    </div>
</template>
