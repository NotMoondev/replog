<script setup lang="ts">
import { useSessionStore, computeVolume, computeRepsVolume, computeCardioScore, computeCardioDuration } from '~/stores/useSessionStore'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import type { WorkoutSessionExercise } from '~/types/session'
import type { MuscleGroup } from '~/types/workout'

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

const currentRepsVolume = computed(() => session.value ? computeRepsVolume(session.value.exercises) : 0)
const prevRepsVolume = computed(() => prevSession.value ? computeRepsVolume(prevSession.value.exercises) : 0)
const repsVolumeDeltaPercent = computed(() => {
    if (!prevSession.value || prevRepsVolume.value === 0) return null
    return Math.round(((currentRepsVolume.value - prevRepsVolume.value) / prevRepsVolume.value) * 100)
})

const currentCardioScore = computed(() => session.value ? computeCardioScore(session.value.exercises) : 0)
const prevCardioScore = computed(() => prevSession.value ? computeCardioScore(prevSession.value.exercises) : 0)
const cardioScoreDeltaPercent = computed(() => {
    if (!prevSession.value || prevCardioScore.value === 0) return null
    return Math.round(((currentCardioScore.value - prevCardioScore.value) / prevCardioScore.value) * 100)
})

const currentCardioDuration = computed(() => session.value ? computeCardioDuration(session.value.exercises) : 0)
const prevCardioDuration = computed(() => prevSession.value ? computeCardioDuration(prevSession.value.exercises) : 0)

const hasWeightedExercises = computed(() => currentVolume.value > 0)
const hasBodyweightExercises = computed(() => currentRepsVolume.value > 0)
const hasCardioExercises = computed(() => currentCardioScore.value > 0)

function exerciseName(ex: WorkoutSessionExercise): string {
    return workout.value?.exercises.find(e => e.id === ex.exerciseId)?.name
        ?? ex.exerciseName
        ?? ex.exerciseId
}

// PR map: best weight/reps per exercise across ALL sessions (cross-workout)
const prMap = computed(() => {
    if (!session.value) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const s of sessionStore.allSessions) {
        if (s.id === session.value.id) continue
        for (const ex of s.exercises) {
            if (!ex.sets) continue
            if (ex.strengthMode === 'time') continue // no PR tracking for time-mode
            const usesWeight = ex.sets.some(set => (set.weight ?? 0) > 0)
            for (const set of ex.sets) {
                const val = usesWeight ? (set.weight ?? 0) : (set.reps ?? 0)
                const prev = map.get(ex.exerciseId) ?? 0
                if (val > prev) map.set(ex.exerciseId, val)
            }
        }
    }
    return map
})

// True if this exercise has no weight recorded (bodyweight / reps-only)
function isBodyweight(ex: WorkoutSessionExercise): boolean {
    if (!ex.sets || ex.sets.length === 0) return false
    if (ex.strengthMode === 'time') return false
    if (ex.strengthMode === 'reps') return true
    return ex.sets.every(s => (s.weight ?? 0) === 0)
}

function isNewPR(ex: WorkoutSessionExercise): boolean {
    if (!ex.sets || ex.sets.length === 0) return false
    if (ex.strengthMode === 'time') return false
    const bodyweight = isBodyweight(ex)
    const maxVal = Math.max(...ex.sets.map(s => bodyweight ? (s.reps ?? 0) : (s.weight ?? 0)))
    if (maxVal === 0) return false
    const prev = prMap.value.get(ex.exerciseId) ?? 0
    return maxVal > prev
}

// Per-set comparison: returns 'better' | 'worse' | 'same' | null
function setComparison(ex: WorkoutSessionExercise, setIndex: number): { label: string; dir: 'better' | 'worse' | 'same' } | null {
    const lastEx = getLastExercise(ex.exerciseId)
    const lastSet = lastEx?.sets?.[setIndex]
    const curSet = ex.sets?.[setIndex]
    if (!lastSet || !curSet) return null

    if (ex.strengthMode === 'time') {
        // Compare durations
        const cur = curSet.duration ?? 0
        const prev = lastSet.duration ?? 0
        if (prev === 0) return null
        return {
            label: formatDuration(prev) ?? '—',
            dir: cur > prev ? 'better' : cur < prev ? 'worse' : 'same',
        }
    } else if (isBodyweight(ex)) {
        // Compare reps
        const diff = (curSet.reps ?? 0) - (lastSet.reps ?? 0)
        return {
            label: `${lastSet.reps ?? 0} Reps`,
            dir: diff > 0 ? 'better' : diff < 0 ? 'worse' : 'same',
        }
    } else {
        // Compare weight
        const cur = curSet.weight ?? 0
        const prev = lastSet.weight ?? 0
        return {
            label: prev > 0 ? `${prev} kg` : '—',
            dir: cur > prev ? 'better' : cur < prev ? 'worse' : 'same',
        }
    }
}

// Find the most recent occurrence of an exercise across ALL sessions (cross-workout)
function getLastExercise(exerciseId: string): WorkoutSessionExercise | null {
    if (!session.value) return null
    const currentIndex = sessionStore.allSessions.findIndex(s => s.id === sessionId.value)
    for (const s of sessionStore.allSessions.slice(currentIndex + 1)) {
        const ex = s.exercises.find(e => e.exerciseId === exerciseId)
        if (ex) return ex
    }
    return null
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

// Muscle group breakdown
const MUSCLE_GROUP_COLORS: Record<string, string> = {
    'Brust':       'bg-rose-500',
    'Rücken':      'bg-sky-500',
    'Schultern':   'bg-violet-500',
    'Bizeps':      'bg-amber-500',
    'Trizeps':     'bg-orange-500',
    'Bauch':       'bg-yellow-500',
    'Quadrizeps':  'bg-emerald-500',
    'Beinbeuger':  'bg-teal-500',
    'Gesäß':       'bg-pink-500',
    'Waden':       'bg-lime-500',
    'Cardio':      'bg-blue-500',
}

const muscleGroupStats = computed(() => {
    if (!session.value) return []
    const scores = new Map<MuscleGroup, number>()

    for (const ex of session.value.exercises) {
        if (!ex.muscleGroups?.length) continue
        let score = 0
        if (ex.sets && ex.sets.length > 0) {
            if (ex.strengthMode === 'time') {
                score = ex.sets.reduce((sum, s) => sum + (s.duration ?? 0), 0)
            } else if (ex.strengthMode === 'reps') {
                score = ex.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0) * 10
            } else {
                const vol = ex.sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)
                score = vol > 0 ? vol : ex.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0) * 10
            }
        } else {
            score = (ex.duration ?? 0) * Math.max(ex.metricValue ?? 1, 1)
        }
        const share = score / ex.muscleGroups.length
        for (const mg of ex.muscleGroups) {
            scores.set(mg, (scores.get(mg) ?? 0) + share)
        }
    }

    if (scores.size === 0) return []
    const total = Array.from(scores.values()).reduce((a, b) => a + b, 0)
    return Array.from(scores.entries())
        .map(([group, score]) => ({ group, percent: Math.round(score / total * 100) }))
        .sort((a, b) => b.percent - a.percent)
})
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
                    <h1 class="text-xl font-semibold truncate">{{ workout?.name ?? session.workoutName ?? 'Session' }}</h1>
                    <p class="text-sm text-text-muted flex items-center gap-2 flex-wrap">
                        <span>{{ formatDate(session.date) }}</span>
                        <span v-if="formatDuration(session.durationSeconds)" class="flex items-center gap-1">
                            <IconClock class="size-3.5" />
                            {{ formatDuration(session.durationSeconds) }}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Weighted volume card -->
            <div v-if="hasWeightedExercises" class="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h2 class="font-medium text-sm">Gesamtvolumen</h2>
                <div class="flex items-end gap-4">
                    <div>
                        <div class="text-2xl font-semibold">{{ currentVolume.toLocaleString('de-DE') }} kg</div>
                        <div class="text-xs text-text-muted mt-0.5">Diese Session</div>
                    </div>
                    <template v-if="prevSession && prevVolume > 0">
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

            <!-- Bodyweight reps card -->
            <div v-if="hasBodyweightExercises" class="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h2 class="font-medium text-sm">Körpergewicht-Übungen</h2>
                <div class="flex items-end gap-4">
                    <div>
                        <div class="text-2xl font-semibold">{{ currentRepsVolume.toLocaleString('de-DE') }}</div>
                        <div class="text-xs text-text-muted mt-0.5">Reps diese Session</div>
                    </div>
                    <template v-if="prevSession && prevRepsVolume > 0">
                        <div class="text-text-muted mb-1">vs.</div>
                        <div>
                            <div class="text-lg font-medium text-text-muted">{{ prevRepsVolume.toLocaleString('de-DE') }}</div>
                            <div class="text-xs text-text-muted mt-0.5">Letzte Session</div>
                        </div>
                        <div v-if="repsVolumeDeltaPercent !== null" class="ml-auto">
                            <span
                                class="text-lg font-semibold"
                                :class="repsVolumeDeltaPercent >= 0 ? 'text-green-400' : 'text-red-400'"
                            >
                                {{ repsVolumeDeltaPercent >= 0 ? '+' : '' }}{{ repsVolumeDeltaPercent }}%
                            </span>
                        </div>
                    </template>
                    <div v-else class="text-xs text-text-muted self-center">Erste Session für dieses Workout</div>
                </div>
            </div>

            <!-- Cardio card -->
            <div v-if="hasCardioExercises" class="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h2 class="font-medium text-sm">Cardio</h2>
                <div class="flex items-end gap-4">
                    <div>
                        <div class="text-2xl font-semibold">{{ formatDuration(currentCardioDuration) }}</div>
                        <div class="text-xs text-text-muted mt-0.5">Diese Session</div>
                    </div>
                    <template v-if="prevSession && prevCardioDuration > 0">
                        <div class="text-text-muted mb-1">vs.</div>
                        <div>
                            <div class="text-lg font-medium text-text-muted">{{ formatDuration(prevCardioDuration) }}</div>
                            <div class="text-xs text-text-muted mt-0.5">Letzte Session</div>
                        </div>
                        <div v-if="cardioScoreDeltaPercent !== null" class="ml-auto">
                            <span
                                class="text-lg font-semibold"
                                :class="cardioScoreDeltaPercent >= 0 ? 'text-green-400' : 'text-red-400'"
                            >
                                {{ cardioScoreDeltaPercent >= 0 ? '+' : '' }}{{ cardioScoreDeltaPercent }}%
                            </span>
                        </div>
                    </template>
                    <div v-else class="text-xs text-text-muted self-center">Erste Session für dieses Workout</div>
                </div>
            </div>

            <!-- Muscle group breakdown -->
            <div v-if="muscleGroupStats.length > 0" class="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h2 class="font-medium text-sm">Beanspruchte Muskelgruppen</h2>
                <div class="space-y-2">
                    <div v-for="item in muscleGroupStats" :key="item.group" class="space-y-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-medium">{{ item.group }}</span>
                            <span class="text-text-muted tabular-nums">{{ item.percent }}%</span>
                        </div>
                        <div class="h-2 bg-surface rounded-full overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                :class="MUSCLE_GROUP_COLORS[item.group] ?? 'bg-primary-500'"
                                :style="{ width: `${item.percent}%` }"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr class="border-border mx-2 shrink-0" />

            <!-- Exercises -->
            <div class="space-y-3">
                <div
                    v-for="ex in session.exercises"
                    :key="ex.exerciseId"
                    class="bg-card border border-border rounded-2xl p-4 space-y-3"
                >
                    <!-- Exercise header -->
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-sm">{{ exerciseName(ex) }}</h3>
                        <span v-if="isNewPR(ex)" class="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                            🏆 Neues PR
                        </span>
                    </div>

                    <!-- Strength sets -->
                    <template v-if="ex.sets && ex.sets.length > 0">
                        <div class="space-y-1">
                            <!-- time-mode header -->
                            <div v-if="ex.strengthMode === 'time'" class="grid grid-cols-3 text-xs text-text-muted mb-2 px-1">
                                <span>Satz</span>
                                <span class="text-center">Dauer</span>
                                <span class="text-center text-primary-400">vs. letzte</span>
                            </div>
                            <!-- reps-only header -->
                            <div v-else-if="ex.strengthMode === 'reps'" class="grid grid-cols-3 text-xs text-text-muted mb-2 px-1">
                                <span>Satz</span>
                                <span class="text-center">Reps</span>
                                <span class="text-center text-primary-400">vs. letzte</span>
                            </div>
                            <!-- reps+weight header -->
                            <div v-else class="grid grid-cols-4 text-xs text-text-muted mb-2 px-1">
                                <span>Satz</span>
                                <span class="text-center">Reps</span>
                                <span class="text-center">{{ isBodyweight(ex) ? '—' : 'Gewicht' }}</span>
                                <span class="text-center text-primary-400">vs. letzte</span>
                            </div>

                            <!-- time-mode rows -->
                            <template v-if="ex.strengthMode === 'time'">
                                <div
                                    v-for="(set, i) in ex.sets"
                                    :key="i"
                                    class="grid grid-cols-3 text-sm py-1.5 px-1 rounded-lg even:bg-surface/40"
                                >
                                    <span class="text-text-muted">{{ i + 1 }}</span>
                                    <span class="text-center font-medium">{{ formatDuration(set.duration) ?? '—' }}</span>
                                    <span class="text-center text-xs">
                                        <template v-if="setComparison(ex, i)">
                                            <span :class="setComparison(ex, i)!.dir === 'better' ? 'text-green-400' : setComparison(ex, i)!.dir === 'worse' ? 'text-red-400' : 'text-text-muted'">
                                                {{ setComparison(ex, i)!.label }}
                                            </span>
                                        </template>
                                        <span v-else class="text-text-muted">—</span>
                                    </span>
                                </div>
                            </template>

                            <!-- reps-only rows -->
                            <template v-else-if="ex.strengthMode === 'reps'">
                                <div
                                    v-for="(set, i) in ex.sets"
                                    :key="i"
                                    class="grid grid-cols-3 text-sm py-1.5 px-1 rounded-lg even:bg-surface/40"
                                >
                                    <span class="text-text-muted">{{ i + 1 }}</span>
                                    <span class="text-center font-medium">{{ set.reps ?? '—' }}</span>
                                    <span class="text-center text-xs">
                                        <template v-if="setComparison(ex, i)">
                                            <span :class="setComparison(ex, i)!.dir === 'better' ? 'text-green-400' : setComparison(ex, i)!.dir === 'worse' ? 'text-red-400' : 'text-text-muted'">
                                                {{ setComparison(ex, i)!.label }}
                                            </span>
                                        </template>
                                        <span v-else class="text-text-muted">—</span>
                                    </span>
                                </div>
                            </template>

                            <!-- reps+weight rows (default) -->
                            <template v-else>
                                <div
                                    v-for="(set, i) in ex.sets"
                                    :key="i"
                                    class="grid grid-cols-4 text-sm py-1.5 px-1 rounded-lg even:bg-surface/40"
                                >
                                    <span class="text-text-muted">{{ i + 1 }}</span>
                                    <span class="text-center font-medium">{{ set.reps ?? '—' }}</span>
                                    <span class="text-center font-medium">
                                        {{ set.weight != null && set.weight > 0 ? `${set.weight} kg` : '—' }}
                                    </span>
                                    <span class="text-center text-xs">
                                        <template v-if="setComparison(ex, i)">
                                            <span :class="setComparison(ex, i)!.dir === 'better' ? 'text-green-400' : setComparison(ex, i)!.dir === 'worse' ? 'text-red-400' : 'text-text-muted'">
                                                {{ setComparison(ex, i)!.label }}
                                            </span>
                                        </template>
                                        <span v-else class="text-text-muted">—</span>
                                    </span>
                                </div>
                            </template>
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

                    <!-- Note -->
                    <div v-if="ex.note" class="flex items-start gap-2 bg-surface/60 border border-border/60 rounded-xl px-3 py-2.5 text-sm text-text-muted">
                        <IconNotebookPen class="size-3.5 shrink-0 mt-0.5 text-primary-400" />
                        <span class="leading-snug">{{ ex.note }}</span>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
