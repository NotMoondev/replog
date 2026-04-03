<script setup lang="ts">
const route = useRoute()

const isHome = computed(() => route.path === '/')
const isWorkouts = computed(() => route.path.startsWith('/workouts'))
const isPlan = computed(() => route.path.startsWith('/plan'))
const isSessions = computed(() => route.path.startsWith('/sessions'))
const isStats = computed(() => route.path.startsWith('/stats'))
const isSession = computed(() => route.path.startsWith('/session/') || route.path === '/session')
</script>

<template>
    <!-- Fade overlay behind the nav -->
    <div v-if="!isSession" class="fixed bottom-0 inset-x-0 h-28 z-30 pointer-events-none"
        style="background: linear-gradient(to top, rgba(var(--color-bg-rgb), 0.85) 0%, rgba(var(--color-bg-rgb), 0) 100%);" />

    <nav v-if="!isSession" class="fixed bottom-4 inset-x-4 z-40">
        <div class="flex bg-card border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(var(--color-bg-rgb),0.8)]">
            <NuxtLink
                to="/"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isHome ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconHouse class="size-5" />
                <span class="text-[10px] font-medium">Home</span>
            </NuxtLink>

            <NuxtLink
                to="/plan"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isPlan ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconCalendar class="size-5" />
                <span class="text-[10px] font-medium">Plan</span>
            </NuxtLink>

            <NuxtLink
                to="/workouts"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isWorkouts ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconDumbbell class="size-5" />
                <span class="text-[10px] font-medium">Workouts</span>
            </NuxtLink>

            <NuxtLink
                to="/sessions"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isSessions ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconClipboardList class="size-5" />
                <span class="text-[10px] font-medium">Sessions</span>
            </NuxtLink>

            <NuxtLink
                to="/stats"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isStats ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconBarChart2 class="size-5" />
                <span class="text-[10px] font-medium">Statistiken</span>
            </NuxtLink>
        </div>
    </nav>
</template>
