<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'
import { useRouter } from 'vue-router'

const store = useWorkoutStore()
const planStore = useTrainingPlanStore()
const router = useRouter()

const today = computed(() => {
    return new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
})

const todayWorkout = computed(() => {
    const wid = planStore.todayWorkoutId
    if (!wid) return null
    return store.workouts.find(w => w.id === wid) ?? null
})

const newWorkoutName = ref('')

onMounted(async () => {
    await Promise.all([store.loadWorkouts(), planStore.loadPlans()])
})

async function createWorkout() {
    const trimmed = newWorkoutName.value.trim()
    if (!trimmed) return

    await store.createWorkout(trimmed)
    const created = store.workouts[store.workouts.length - 1]
    newWorkoutName.value = ''
    router.push(`/workouts/${created?.id}`)
}
</script>

<template>
    <div class="min-h-screen bg-bg text-text p-4 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <div class="">
                <h3 id="app-logo" class="font-black italic text-3xl">REPLOG</h3>
                <p class="text-text-muted text-sm capitalize">{{ today }}</p>
            </div>
            <div class="flex items-center gap-3">
                <NuxtLink to="/settings" class="text-text-muted hover:text-text">
                    <IconSettings class="w-6 h-6" />
                </NuxtLink>
            </div>
        </div>

        <!-- Today's Training Card -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            <h2 class="text-sm text-text-muted font-medium">Heutiges Training</h2>

            <div v-if="!planStore.activePlan" class="text-sm text-text-muted">
                Kein Trainingsplan aktiv.
                <NuxtLink to="/plan" class="text-primary-400 hover:underline">Plan erstellen</NuxtLink>
            </div>

            <div v-else-if="planStore.todayIsRestDay" class="flex items-center gap-2 text-text-muted">
                <IconBedDouble class="w-5 h-5" />
                <span class="text-sm">Ruhetag — erhole dich gut!</span>
            </div>

            <div v-else-if="todayWorkout" class="space-y-3">
                <div>
                    <div class="font-medium">{{ todayWorkout.name }}</div>
                    <div class="text-xs text-text-muted">{{ todayWorkout.exercises.length }} Übungen</div>
                </div>
                <NuxtLink :to="`/session/${todayWorkout.id}`"
                    class="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center rounded-xl py-2.5 font-medium transition">
                    Training starten
                </NuxtLink>
            </div>

            <div v-else class="text-sm text-text-muted">
                Kein Workout für heute eingetragen.
                <NuxtLink to="/plan" class="text-primary-400 hover:underline">Plan bearbeiten</NuxtLink>
            </div>
        </div>

        <!-- Quick Navigation Cards -->
        <div class="grid gap-3">
            <NuxtLink to="/workouts"
                class="bg-card border border-border rounded-2xl p-4 hover:bg-neutral-800 transition flex items-center gap-3">
                <IconDumbbell class="w-5 h-5 text-primary-400" />
                <div>
                    <div class="text-base font-medium">Workouts</div>
                    <div class="text-sm text-text-muted">Erstellen & verwalten</div>
                </div>
            </NuxtLink>

            <NuxtLink to="/plan"
                class="bg-card border border-border rounded-2xl p-4 hover:bg-neutral-800 transition flex items-center gap-3">
                <IconCalendar class="w-5 h-5 text-primary-400" />
                <div>
                    <div class="text-base font-medium">Trainingsplan</div>
                    <div class="text-sm text-text-muted">Wochenplan bearbeiten</div>
                </div>
            </NuxtLink>

            <NuxtLink to="/stats"
                class="bg-card border border-border rounded-2xl p-4 hover:bg-neutral-800 transition flex items-center gap-3">
                <IconBarChart2 class="w-5 h-5 text-primary-400" />
                <div>
                    <div class="text-base font-medium">Statistiken</div>
                    <div class="text-sm text-text-muted">Fortschritt ansehen</div>
                </div>
            </NuxtLink>
        </div>

        <!-- Quick Workout Create -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            <h2 class="text-sm text-text-muted font-medium">Workout erstellen</h2>

            <div class="flex gap-2">
                <input v-model="newWorkoutName" placeholder="Workout Name"
                    class="flex-1 bg-neutral-600 rounded-lg p-2 px-3 text-sm outline-none" />
                <button @click="createWorkout"
                    class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-1">
                    <IconPlus class="w-4 h-4" /> Erstellen
                </button>
            </div>
        </div>

        <!-- Recent Workouts -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-2">
            <h2 class="text-sm text-text-muted">Letzte Workouts</h2>

            <div v-if="store.workouts.length === 0" class="text-sm text-text-muted">
                Noch keine Workouts
            </div>

            <div v-else class="space-y-1">
                <div v-for="w in store.workouts.slice(0, 3)" :key="w.id"
                    class="text-sm flex justify-between items-center">
                    <span>{{ w.name }}</span>
                    <NuxtLink :to="`/workouts/${w.id}`"
                        class="flex items-center gap-1 text-primary-400 hover:text-primary-500 text-xs">
                        Bearbeiten
                        <IconArrowRight class="w-3 h-3" />
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>
