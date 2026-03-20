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
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-semibold">{{ plan.name }}</h1>
                <span v-if="plan.isActive" class="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                    Aktiv
                </span>
            </div>

            <div class="space-y-3">
                <div
                    v-for="weekday in 7"
                    :key="weekday - 1"
                    class="bg-card border border-border rounded-2xl p-4 space-y-3"
                >
                    <div class="flex justify-between items-center">
                        <span class="font-medium">{{ WEEKDAYS[weekday - 1] }}</span>
                        <label class="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                            <span>Ruhetag</span>
                            <input
                                type="checkbox"
                                :checked="getDayData(weekday - 1).isRestDay"
                                @change="toggleRestDay(weekday - 1, ($event.target as HTMLInputElement).checked)"
                                class="w-4 h-4 accent-primary-500"
                            />
                        </label>
                    </div>

                    <div v-if="!getDayData(weekday - 1).isRestDay">
                        <select
                            :value="getDayData(weekday - 1).workoutId ?? ''"
                            @change="setWorkout(weekday - 1, ($event.target as HTMLSelectElement).value)"
                            class="w-full bg-neutral-800 border border-border rounded-xl px-3 py-2.5 text-sm outline-none appearance-none focus:border-primary-500 transition-colors cursor-pointer"
                        >
                            <option value="">Workout wählen...</option>
                            <option
                                v-for="w in workoutStore.workouts"
                                :key="w.id"
                                :value="w.id"
                            >
                                {{ w.name }}
                            </option>
                        </select>
                        <p v-if="!getDayData(weekday - 1).workoutId" class="text-xs text-yellow-400/80 mt-1 pl-1">
                            Kein Workout ausgewählt
                        </p>
                    </div>

                    <div v-else class="text-sm text-text-muted italic">Ruhetag</div>
                </div>
            </div>
        </template>
    </div>
</template>
