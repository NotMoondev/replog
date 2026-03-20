<script setup lang="ts">
const route = useRoute()

const isHome = computed(() => route.path === '/')
const isWorkouts = computed(() => route.path.startsWith('/workouts'))
const isPlan = computed(() => route.path.startsWith('/plan'))
const isStats = computed(() => route.path.startsWith('/stats'))
const isSession = computed(() => route.path.startsWith('/session'))
</script>

<template>
    <nav v-if="!isSession" class="fixed bottom-4 inset-x-4 z-40">
        <div class="flex bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <NuxtLink
                to="/"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isHome ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconHouse class="size-5" />
                <span class="text-[10px] font-medium">Home</span>
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
                to="/plan"
                class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
                :class="isPlan ? 'text-primary-500' : 'text-text-muted'"
            >
                <IconCalendar class="size-5" />
                <span class="text-[10px] font-medium">Plan</span>
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
