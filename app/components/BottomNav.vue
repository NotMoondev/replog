<script setup lang="ts">
import { useActiveSession } from '~/composables/useActiveSession'
const route = useRoute()
const router = useRouter()
const activeSession = useActiveSession()

const isSession = computed(() => route.path.startsWith('/session/') || route.path === '/session')

function isActive(path: string): boolean {
    return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
    <!-- Fade overlay behind the nav -->
    <div v-if="!isSession" class="fixed bottom-0 inset-x-0 h-30 z-30 pointer-events-none nav-fade-overlay" />

    <div v-if="!isSession" class="fixed bottom-6 inset-x-4 z-40 flex flex-col gap-2">
        <!-- Active session resume banner -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
        >
            <button
                v-if="activeSession.isActive.value"
                @click="router.push(activeSession.sessionRoute.value!)"
                class="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2.5 px-4 font-semibold text-sm flex items-center gap-2 shadow-lg transition-colors"
            >
                <IconPlay class="size-4 shrink-0" />
                <span class="flex-1 text-left truncate">{{ activeSession.meta.value?.workoutName }} fortsetzen</span>
                <span class="text-xs bg-white/20 rounded-md px-1.5 py-0.5 shrink-0">aktiv</span>
            </button>
        </Transition>

        <!-- Bottom nav card -->
        <nav>
        <div class="flex bg-card border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(var(--color-bg-rgb),0.8)]">
            <NuxtLink
                to="/"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isActive('/') ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconHouse class="size-5" />
                <span class="text-[10px] font-medium">Home</span>
            </NuxtLink>

            <NuxtLink
                to="/exercises"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isActive('/exercises') ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconListChecks class="size-5" />
                <span class="text-[10px] font-medium">Übungen</span>
            </NuxtLink>

            <NuxtLink
                to="/workouts"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isActive('/workouts') ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconDumbbell class="size-5" />
                <span class="text-[10px] font-medium">Workouts</span>
            </NuxtLink>

            <NuxtLink
                to="/sessions"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isActive('/sessions') ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconClipboardList class="size-5" />
                <span class="text-[10px] font-medium">Sessions</span>
            </NuxtLink>

            <NuxtLink
                to="/stats"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isActive('/stats') ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconBarChart2 class="size-5" />
                <span class="text-[10px] font-medium">Statistiken</span>
            </NuxtLink>
        </div>
        </nav>
    </div>
</template>
