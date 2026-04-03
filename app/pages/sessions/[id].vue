<script setup lang="ts">
import { useSessionStore, computeVolume } from '~/stores/useSessionStore'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import type { WorkoutSessionExercise } from '~/types/session'

const route = useRoute()
const sessionStore = useSessionStore()
const workoutStore = useWorkoutStore()

const sessionId = computed(() => route.params.id as string)

onMounted(async () => {
    await Promise.all([
        sessionStore.loadAllSessions(),
        workoutStore.loadWorkouts(),
    ])
})

const session = computed(() =>
    sessionStore.allSessions.find(s => s.id === sessionId.value)
)

const workout = computed(() =>
    session.value ? workoutStore.workouts.find(w => w.id === session.value!.workoutId) : undefined
)

// Previous session for same workout (next in allSessions since sorted desc)
const prevSession = computed(() => {
    if (!session.value) return null
    const currentIndex = sessionStore.allSessions.findIndex(s => s.id === sessionId.value)
    return sessionStore.allSessions
        .slice(currentIndex + 1)
        .find(s => s.workoutId === session.value!.workoutId) ?? null
})

const currentVolume = computed(() => session.value ? computeVolume(session.value.exercises) : 0)
const prevVolume = computed(() => prevSession.value ? computeVolume(prevSession.value.exercises) : 0)
const volumeDeltaPercent = computed(() => {
    if (!prevSession.value || prevVolume.value === 0) return null
    return Math.round(((currentVolume.value - prevVolume.value) / prevVolume.value) * 100)
})

function exerciseName(exerciseId: string): string {
    return workout.value?.exercises.find(e => e.id === exerciseId)?.name ?? exerciseId
}

// PRs: highest weight per exercise across ALL sessions for same workout
const prMap = computed(() => {
    if (!session.value) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const s of sessionStore.allSessions) {
        if (s.workoutId !== session.value.workoutId || s.id === session.value.id) continue
        for (const ex of s.exercises) {
            if (!ex.sets) continue
            for (const set of ex.sets) {
                const prev = map.get(ex.exerciseId) ?? 0
                if ((set.weight ?? 0) > prev) map.set(ex.exerciseId, set.weight ?? 0)
            }
        }
    }
    return map
})

function isNewPR(ex: WorkoutSessionExercise): boolean {
    if (!ex.sets || ex.sets.length === 0) return false
    const maxWeight = Math.max(...ex.sets.map(s => s.weight ?? 0))
    if (maxWeight === 0) return false
    const prev = prMap.value.get(ex.exerciseId) ?? 0
    return maxWeight > prev
}

function getLastExercise(exerciseId: string): WorkoutSessionExercise | null {
    return prevSession.value?.exercises.find(e => e.exerciseId === exerciseId) ?? null
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDuration(seconds?: number): string | null {
    if (!seconds) return null
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s}s`
    return s > 0 ? `${m} min ${s}s` : `${m} min`
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-4 pb-28">
        <div v-if="sessionStore.loading || !session" class="flex justify-center py-20">
            <IconLoaderCircle class="size-12 animate-spin text-primary-500" />
        </div>

        <template v-else>
            <!-- Header -->
            <div class="flex items-center gap-3">
                <button @click="$router.back()" class="text-text-muted hover:text-text transition-colors shrink-0">
                    <IconChevronLeft class="size-6" />
                </button>
                <div class="min-w-0">
                    <h1 class="text-xl font-semibold truncate">{{ workout?.name ?? 'Session' }}</h1>
                    <p class="text-sm text-text-muted flex items-center gap-2 flex-wrap">
                        <span>{{ formatDate(session.date) }}</span>
                        <span v-if="formatDuration(session.durationSeconds)" class="flex items-center gap-1">
                            <IconClock class="size-3.5" />
                            {{ formatDuration(session.durationSeconds) }}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Volume comparison card -->
            <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h2 class="font-medium text-sm">Gesamtvolumen</h2>
                <div class="flex items-end gap-4">
                    <div>
                        <div class="text-2xl font-semibold">{{ currentVolume.toLocaleString('de-DE') }} kg</div>
                        <div class="text-xs text-text-muted mt-0.5">Diese Session</div>
                    </div>
                    <template v-if="prevSession">
                        <div class="text-text-muted mb-1">vs.</div>
                        <div>
                            <div class="text-lg font-medium text-text-muted">{{ prevVolume.toLocaleString('de-DE') }} kg</div>
                            <div class="text-xs text-text-muted mt-0.5">Letzte Session</div>
                        </div>
                        <div v-if="volumeDeltaPercent !== null" class="ml-auto">
                            <span
                                class="text-lg font-semibold"
                                :class="volumeDeltaPercent >= 0 ? 'text-green-400' : 'text-red-400'"
                            >
                                {{ volumeDeltaPercent >= 0 ? '+' : '' }}{{ volumeDeltaPercent }}%
                            </span>
                        </div>
                    </template>
                    <div v-else class="text-xs text-text-muted self-center">Erste Session für dieses Workout</div>
                </div>
            </div>

            <!-- Exercises -->
            <div class="space-y-3">
                <div
                    v-for="ex in session.exercises"
                    :key="ex.exerciseId"
                    class="bg-card border border-border rounded-2xl p-4 space-y-3"
                >
                    <!-- Exercise header -->
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-sm">{{ exerciseName(ex.exerciseId) }}</h3>
                        <span v-if="isNewPR(ex)" class="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                            🏆 Neues PR
                        </span>
                    </div>

                    <!-- Strength sets -->
                    <template v-if="ex.sets && ex.sets.length > 0">
                        <div class="space-y-1">
                            <div class="grid grid-cols-4 text-xs text-text-muted mb-2 px-1">
                                <span>Satz</span>
                                <span class="text-center">Wdh</span>
                                <span class="text-center">Gewicht</span>
                                <span class="text-center text-primary-400">vs. letzte</span>
                            </div>
                            <div
                                v-for="(set, i) in ex.sets"
                                :key="i"
                                class="grid grid-cols-4 text-sm py-1.5 px-1 rounded-lg even:bg-surface/40"
                            >
                                <span class="text-text-muted">{{ i + 1 }}</span>
                                <span class="text-center font-medium">{{ set.reps }}</span>
                                <span class="text-center font-medium">
                                    {{ set.weight != null ? `${set.weight} kg` : '—' }}
                                </span>
                                <span class="text-center text-xs">
                                    <template v-if="getLastExercise(ex.exerciseId)?.sets?.[i]">
                                        <span :class="(set.weight ?? 0) > (getLastExercise(ex.exerciseId)!.sets![i]!.weight ?? 0) ? 'text-green-400' : (set.weight ?? 0) < (getLastExercise(ex.exerciseId)!.sets![i]!.weight ?? 0) ? 'text-red-400' : 'text-text-muted'">
                                            {{ getLastExercise(ex.exerciseId)?.sets?.[i]?.weight != null ? `${getLastExercise(ex.exerciseId)!.sets![i]!.weight} kg` : '—' }}
                                        </span>
                                    </template>
                                    <span v-else class="text-text-muted">—</span>
                                </span>
                            </div>
                        </div>
                    </template>

                    <!-- Cardio -->
                    <template v-else>
                        <div class="flex gap-4 text-sm">
                            <div v-if="ex.duration != null">
                                <div class="font-medium">{{ Math.floor(ex.duration / 60) }}:{{ String(ex.duration % 60).padStart(2, '0') }}</div>
                                <div class="text-xs text-text-muted">Dauer</div>
                            </div>
                            <div v-if="ex.metricValue != null">
                                <div class="font-medium">{{ ex.metricValue }}</div>
                                <div class="text-xs text-text-muted">Wert</div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>
