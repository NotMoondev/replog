<script setup lang="ts">
import type { WorkoutSessionExercise } from '~/types/session'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useSessionStore } from '~/stores/useSessionStore'

interface LocalSet {
    reps?: number
    weight?: number
    completed: boolean
}

interface LocalExercise {
    exerciseId: string
    completed: boolean
    sets: LocalSet[]
    duration?: number
    metricValue?: number
}

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()
const sessionStore = useSessionStore()

const workoutId = computed(() => route.params.workoutId as string)
const workout = computed(() => workoutStore.workouts.find(w => w.id === workoutId.value))

const localData = ref<LocalExercise[]>([])
const lastSession = ref<Awaited<ReturnType<typeof sessionStore.getLastSessionForWorkout>>>(null)
const saving = ref(false)
const sessionStartTime = ref(0)

const timer = useTimer()
const totalCompletedSets = computed(() => {
    let count = 0
    for (const d of localData.value) {
        if (d.sets.length > 0) {
            count += d.sets.filter(s => s.completed).length
        } else if (d.completed) {
            count++
        }
    }
    return count
})
watch(totalCompletedSets, (newVal, oldVal) => {
    if (newVal > oldVal) timer.start()
})

// Leave guard
const showLeaveDialog = ref(false)
const leaveConfirmed = ref(false)
let pendingRoute: string | null = null

onBeforeRouteLeave((to) => {
    if (!leaveConfirmed.value && doneCount.value > 0) {
        showLeaveDialog.value = true
        pendingRoute = to.fullPath
        return false
    }
})

function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (doneCount.value > 0) {
        e.preventDefault()
        e.returnValue = ''
    }
}

function confirmLeave() {
    leaveConfirmed.value = true
    showLeaveDialog.value = false
    if (pendingRoute) {
        router.push(pendingRoute)
    } else {
        router.back()
    }
}

onMounted(async () => {
    sessionStartTime.value = Date.now()
    window.addEventListener('beforeunload', handleBeforeUnload)
    await workoutStore.loadWorkouts()
    lastSession.value = await sessionStore.getLastSessionForWorkout(workoutId.value)
    initLocalData()
})

onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
})

watch(workout, () => {
    if (workout.value && localData.value.length === 0) initLocalData()
})

function initLocalData() {
    if (!workout.value) return
    localData.value = workout.value.exercises.map(ex => {
        const lastEx = lastSession.value?.exercises.find(e => e.exerciseId === ex.id)
        if (ex.type === 'strength') {
            return {
                exerciseId: ex.id,
                completed: false,
                sets: ex.sets.map((set, i) => ({
                    reps: lastEx?.sets?.[i]?.reps ?? set.reps ?? undefined,
                    weight: lastEx?.sets?.[i]?.weight ?? set.weight ?? undefined,
                    completed: false,
                })),
                duration: undefined,
                metricValue: undefined,
            }
        } else {
            return {
                exerciseId: ex.id,
                completed: false,
                sets: [],
                duration: lastEx?.duration ?? ex.duration,
                metricValue: lastEx?.metricValue ?? ex.metricValue,
            }
        }
    })
}

function getLastExercise(exerciseId: string) {
    return lastSession.value?.exercises.find(e => e.exerciseId === exerciseId) ?? null
}

const doneCount = computed(() => {
    return localData.value.filter(d => {
        const ex = workout.value?.exercises.find(e => e.id === d.exerciseId)
        if (ex?.type === 'strength') return d.sets.some(s => s.completed)
        return d.completed
    }).length
})

const exerciseItems = computed(() =>
    (workout.value?.exercises ?? []).map((ex, i) => ({
        exercise: ex,
        localItem: localData.value[i] as LocalExercise,
        last: getLastExercise(ex.id),
        index: i,
    })).filter(item => item.localItem !== undefined)
)

async function finish() {
    saving.value = true
    const exercises: WorkoutSessionExercise[] = localData.value
        .filter(d => {
            const ex = workout.value?.exercises.find(e => e.id === d.exerciseId)
            if (ex?.type === 'strength') return d.sets.some(s => s.completed)
            return d.completed
        })
        .map(d => {
            const ex = workout.value?.exercises.find(e => e.id === d.exerciseId)
            if (ex?.type === 'strength') {
                return {
                    exerciseId: d.exerciseId,
                    sets: d.sets
                        .filter(s => s.completed)
                        .map(s => ({ reps: s.reps ?? 0, weight: s.weight })),
                }
            } else {
                return {
                    exerciseId: d.exerciseId,
                    duration: d.duration,
                    metricValue: d.metricValue,
                }
            }
        })

    const durationSeconds = Math.round((Date.now() - sessionStartTime.value) / 1000)
    leaveConfirmed.value = true
    await sessionStore.completeSession(workoutId.value, exercises, durationSeconds)

    // Neue Werte in Workout speichern
    if (workout.value) {
        for (const d of localData.value) {
            const exIndex = workout.value.exercises.findIndex(e => e.id === d.exerciseId)
            if (exIndex === -1) continue
            const ex = workout.value.exercises[exIndex]
            if (!ex) continue
            if (ex.type === 'strength') {
                // Nur abgeschlossene Sätze übernehmen
                const completedSets = d.sets.filter(s => s.completed)
                if (completedSets.length === 0) continue
                const updatedEx = {
                    ...ex,
                    sets: d.sets.map(s => ({
                        reps: s.reps ?? ex.sets[d.sets.indexOf(s)]?.reps ?? 0,
                        weight: s.weight,
                    })),
                }
                await workoutStore.updateExercise(workoutId.value, exIndex, updatedEx)
            } else {
                // Cardio
                if (!d.completed) continue
                const updatedEx = {
                    ...ex,
                    duration: d.duration ?? ex.duration,
                    metricValue: d.metricValue ?? ex.metricValue,
                }
                await workoutStore.updateExercise(workoutId.value, exIndex, updatedEx)
            }
        }
    }

    saving.value = false
    router.back()
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-4">
        <div v-if="!workout || localData.length === 0" class="flex justify-center py-20">
            <IconLoaderCircle class="size-12 animate-spin text-primary-500" />
        </div>

        <template v-else>
            <!-- Pause Timer Banner -->
            <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div v-if="timer.isRunning.value" class="bg-primary-500/15 border border-primary-500/40 rounded-2xl p-3 flex items-center justify-between sticky top-4 z-10">
                    <div class="flex items-center gap-3">
                        <IconTimer class="size-5 text-primary-400 shrink-0" />
                        <div>
                            <div class="text-xs text-text-muted">Pause</div>
                            <div class="text-2xl font-mono font-semibold text-primary-400">{{ timer.formattedRemaining.value }}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="timer.reset()"
                            class="text-xs bg-surface hover:bg-surface-hover border border-border rounded-lg px-3 py-1.5 transition-colors font-medium"
                        >
                            Neu starten
                        </button>
                        <button
                            @click="timer.stop()"
                            class="text-xs text-text-muted hover:text-text transition-colors px-2 py-1.5"
                        >
                            <IconX class="size-4" />
                        </button>
                    </div>
                </div>
            </Transition>

            <div>
                <h1 class="text-2xl font-semibold">{{ workout.name }}</h1>
                <p class="text-sm text-text-muted">
                    {{ doneCount }} / {{ workout.exercises.length }} erledigt
                    <span v-if="lastSession" class="ml-2 text-text-muted">
                        · Letztes Training: {{ new Date(lastSession.date).toLocaleDateString('de-DE') }}
                    </span>
                </p>
            </div>

            <div class="space-y-3">
                <SessionExerciseCard
                    v-for="item in exerciseItems"
                    :key="item.exercise.id"
                    :exercise="item.exercise"
                    :lastExercise="item.last"
                    :modelValue="item.localItem"
                    @update:modelValue="localData[item.index] = $event"
                />
            </div>

            <button
                @click="finish"
                :disabled="saving || doneCount === 0"
                class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <IconLoaderCircle v-if="saving" class="size-4 animate-spin" />
                Session abschließen
            </button>
        </template>

        <!-- Leave warning dialog -->
        <Teleport to="body">
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="showLeaveDialog" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <Transition
                        appear
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 scale-95"
                        enter-to-class="opacity-100 scale-100"
                    >
                        <div class="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-sm w-full">
                            <h3 class="font-semibold text-lg">Training verlassen?</h3>
                            <p class="text-sm text-text-muted">Nicht gespeicherte Fortschritte gehen verloren.</p>
                            <div class="flex gap-3">
                                <button
                                    @click="showLeaveDialog = false"
                                    class="flex-1 bg-surface hover:bg-surface-hover rounded-xl py-2.5 font-semibold text-sm transition-colors"
                                >
                                    Weitertrainieren
                                </button>
                                <button
                                    @click="confirmLeave"
                                    class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
                                >
                                    Verlassen
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

