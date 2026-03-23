<script setup lang="ts">
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'
import { useWorkoutStore } from '~/stores/useWorkoutStore'

const route = useRoute()
const planStore = useTrainingPlanStore()
const workoutStore = useWorkoutStore()

const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

const plan = computed(() => planStore.plans.find(p => p.id === route.params.id))

onMounted(async () => {
    await Promise.all([planStore.loadPlans(), workoutStore.loadWorkouts()])
})

function getDayData(weekday: number) {
    return plan.value?.days.find(d => d.weekday === weekday)
        ?? { weekday, isRestDay: true, workoutId: undefined }
}

async function toggleRestDay(weekday: number, isRestDay: boolean) {
    await planStore.updateDay(plan.value!.id, weekday, {
        isRestDay,
        workoutId: isRestDay ? undefined : getDayData(weekday).workoutId,
    })
}

async function setWorkout(weekday: number, workoutId: string) {
    await planStore.updateDay(plan.value!.id, weekday, {
        workoutId: workoutId || undefined,
    })
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-4">
        <div v-if="!plan" class="text-center text-text-muted py-10">Plan nicht gefunden</div>

        <template v-else>
            <!-- Header -->
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-semibold">{{ plan.name }}</h1>
                <span v-if="plan.isActive" class="text-xs bg-primary-500 text-white px-2.5 py-1 rounded-full font-medium">
                    Aktiv
                </span>
            </div>

            <!-- Day cards -->
            <div class="space-y-2">
                <div
                    v-for="weekday in 7"
                    :key="weekday - 1"
                    class="bg-card border rounded-2xl overflow-hidden transition-colors duration-200"
                    :class="getDayData(weekday - 1).isRestDay ? 'border-border' : 'border-primary-500/30'"
                >
                    <!-- Row: icon + name + toggle pill -->
                    <div class="flex items-center justify-between px-4 py-3.5 gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                            <div
                                class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                                :class="getDayData(weekday - 1).isRestDay
                                    ? 'bg-surface text-text-muted'
                                    : 'bg-primary-500/15 text-primary-400'"
                            >
                                <IconMoon v-if="getDayData(weekday - 1).isRestDay" class="size-4" />
                                <IconDumbbell v-else class="size-4" />
                            </div>
                            <div class="min-w-0">
                                <span class="font-medium text-sm">{{ WEEKDAYS[weekday - 1] }}</span>
                                <p
                                    v-if="!getDayData(weekday - 1).isRestDay && getDayData(weekday - 1).workoutId"
                                    class="text-xs text-text-muted truncate"
                                >
                                    {{ workoutStore.workouts.find(w => w.id === getDayData(weekday - 1).workoutId)?.name }}
                                </p>
                            </div>
                        </div>

                        <!-- Rest / Workout toggle pill -->
                        <div class="flex bg-surface rounded-xl p-0.5 text-xs font-medium shrink-0">
                            <button
                                class="px-2.5 py-1.5 rounded-[10px] transition-all duration-150"
                                :class="getDayData(weekday - 1).isRestDay
                                    ? 'bg-card text-text shadow-sm'
                                    : 'text-text-muted hover:text-text'"
                                @click="toggleRestDay(weekday - 1, true)"
                            >
                                Ruhetag
                            </button>
                            <button
                                class="px-2.5 py-1.5 rounded-[10px] transition-all duration-150"
                                :class="!getDayData(weekday - 1).isRestDay
                                    ? 'bg-primary-500 text-white shadow-sm'
                                    : 'text-text-muted hover:text-text'"
                                @click="toggleRestDay(weekday - 1, false)"
                            >
                                Workout
                            </button>
                        </div>
                    </div>

                    <!-- Workout selector (visible when not a rest day) -->
                    <div
                        v-if="!getDayData(weekday - 1).isRestDay"
                        class="px-4 pb-4"
                    >
                        <div class="relative">
                            <select
                                :value="getDayData(weekday - 1).workoutId ?? ''"
                                @change="setWorkout(weekday - 1, ($event.target as HTMLSelectElement).value)"
                                class="w-full bg-surface border rounded-xl px-3 py-2.5 pr-8 text-sm outline-none appearance-none cursor-pointer transition-colors"
                                :class="getDayData(weekday - 1).workoutId
                                    ? 'border-border text-text focus:border-primary-500'
                                    : 'border-yellow-500/40 text-text-muted focus:border-yellow-500'"
                            >
                                <option value="">Workout wählen…</option>
                                <option v-for="w in workoutStore.workouts" :key="w.id" :value="w.id">
                                    {{ w.name }}
                                </option>
                            </select>
                            <IconChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-text-muted pointer-events-none" />
                        </div>
                        <p v-if="!getDayData(weekday - 1).workoutId" class="flex items-center gap-1 text-xs text-yellow-400/80 mt-1.5 pl-1">
                            <IconAlertCircle class="size-3 shrink-0" />
                            Kein Workout ausgewählt
                        </p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
