<script setup lang="ts">
import type { WorkoutSessionExercise } from '~/types/session'
import type { Exercise, StrengthExercise } from '~/types/workout'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useSessionStore } from '~/stores/useSessionStore'
import { useActiveSession } from '~/composables/useActiveSession'

interface LocalSet {
    reps?: number
    weight?: number
    duration?: number
    completed: boolean
}

interface LocalExercise {
    exerciseId: string
    completed: boolean
    sets: LocalSet[]
    duration?: number
    metricValue?: number
    skipped?: boolean
    note?: string
}

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()
const sessionStore = useSessionStore()
const activeSession = useActiveSession()

const workoutId = computed(() => route.params.workoutId as string)
const workout = computed(() => workoutStore.workouts.find(w => w.id === workoutId.value))

const localData = ref<LocalExercise[]>([])
const addedExercises = ref<Exercise[]>([])
const lastSession = ref<Awaited<ReturnType<typeof sessionStore.getLastSessionForWorkout>>>(null)
const saving = ref(false)
const sessionStartTime = ref(0)
const showExercisePicker = ref(false)

const timer = useTimer()

// Draft persistence
const draftKey = computed(() => `replog-session-draft-${workoutId.value}`)

function saveDraft() {
    if (localData.value.length === 0) return
    try {
        const elapsedSeconds = sessionStartTime.value > 0
            ? Math.round((Date.now() - sessionStartTime.value) / 1000)
            : 0
        localStorage.setItem(draftKey.value, JSON.stringify({
            localData: localData.value,
            addedExercises: addedExercises.value,
            elapsedSeconds,
            timerEndTime: timer.isRunning.value ? timer.getEndTime() : null,
        }))
    } catch { /* quota exceeded – silently ignore */ }
}

function clearDraft() {
    localStorage.removeItem(draftKey.value)
}

let isRestoring = false

function restoreDraft(): boolean {
    try {
        const raw = localStorage.getItem(draftKey.value)
        if (!raw) return false
        const draft = JSON.parse(raw)
        isRestoring = true
        const elapsedMs = (draft.elapsedSeconds ?? 0) * 1000
        sessionStartTime.value = Date.now() - elapsedMs
        localData.value = draft.localData
        addedExercises.value = draft.addedExercises ?? []
        if (typeof draft.timerEndTime === 'number') {
            timer.resumeFromEndTime(draft.timerEndTime)
        }
        return true
    } catch {
        isRestoring = false
        return false
    }
}

watch(localData, saveDraft, { deep: true })
watch(addedExercises, saveDraft, { deep: true })
watch([timer.isRunning, timer.hasEnded], saveDraft)

const totalCompletedSets = computed(() => {
    let count = 0
    for (const d of localData.value) {
        if (d.skipped) continue
        if (d.sets.length > 0) {
            count += d.sets.filter(s => s.completed).length
        } else if (d.completed) {
            count++
        }
    }
    return count
})

watch(totalCompletedSets, (newVal, oldVal) => {
    if (!isRestoring && newVal > oldVal) timer.start()
})

// Abandon dialog
const showAbandonDialog = ref(false)

function confirmAbandon() {
    showAbandonDialog.value = false
    activeSession.clear()
    router.back()
}

onMounted(async () => {
    await workoutStore.loadWorkouts()
    lastSession.value = await sessionStore.getLastSessionForWorkout(workoutId.value)
    if (restoreDraft()) {
        await nextTick()
        isRestoring = false
        if (doneCount.value > 0) {
            useToast().addToast('Training fortgesetzt')
        }
    } else {
        sessionStartTime.value = Date.now()
        initLocalData()
    }
    activeSession.set(workoutId.value, workout.value?.name ?? '')
})

watch(workout, () => {
    if (workout.value && localData.value.length === 0 && !localStorage.getItem(draftKey.value)) initLocalData()
})

function initLocalData() {
    if (!workout.value) return
    localData.value = workout.value.exercises.map(ex => {
        const lastEx = lastSession.value?.exercises.find(e => e.exerciseId === ex.id)
        if (ex.type === 'strength') {
            const mode = (ex as StrengthExercise).mode ?? 'reps+weight'
            return {
                exerciseId: ex.id,
                completed: false,
                sets: ex.sets.map((set, i) => ({
                    reps: mode !== 'time' ? (lastEx?.sets?.[i]?.reps ?? set.reps ?? undefined) : undefined,
                    weight: mode === 'reps+weight' ? (lastEx?.sets?.[i]?.weight ?? set.weight ?? undefined) : undefined,
                    duration: mode === 'time' ? (lastEx?.sets?.[i]?.duration ?? set.duration ?? undefined) : undefined,
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

// All exercises in play (workout + added)
const allExercises = computed(() => [...(workout.value?.exercises ?? []), ...addedExercises.value])

const doneCount = computed(() => {
    return localData.value.filter((d, i) => {
        if (d.skipped) return false
        const ex = allExercises.value[i]
        if (ex?.type === 'strength') return d.sets.some(s => s.completed)
        return d.completed
    }).length
})

const exerciseItems = computed(() => {
    const workoutExs = workout.value?.exercises ?? []
    const items: Array<{ exercise: Exercise; localItem: LocalExercise; last: WorkoutSessionExercise | null; index: number }> = []

    for (let i = 0; i < workoutExs.length; i++) {
        const ex = workoutExs[i]
        const localItem = localData.value[i]
        if (!ex || !localItem) continue
        items.push({ exercise: ex, localItem, last: getLastExercise(ex.id), index: i })
    }

    for (let j = 0; j < addedExercises.value.length; j++) {
        const ex = addedExercises.value[j]
        const i = workoutExs.length + j
        const localItem = localData.value[i]
        if (!ex || !localItem) continue
        items.push({ exercise: ex, localItem, last: null, index: i })
    }

    return items
})

function handleExerciseSelected(exercise: Exercise) {
    addedExercises.value.push(exercise)
    if (exercise.type === 'strength') {
        const mode = (exercise as StrengthExercise).mode ?? 'reps+weight'
        localData.value.push({
            exerciseId: exercise.id,
            completed: false,
            sets: exercise.sets.map(s => ({
                reps: mode !== 'time' ? s.reps : undefined,
                weight: mode === 'reps+weight' ? s.weight : undefined,
                duration: mode === 'time' ? s.duration : undefined,
                completed: false,
            })),
        })
    } else {
        localData.value.push({
            exerciseId: exercise.id,
            completed: false,
            sets: [],
            duration: exercise.duration,
            metricValue: exercise.metricValue,
        })
    }
    showExercisePicker.value = false
}

async function finish() {
    saving.value = true
    const exercises: WorkoutSessionExercise[] = []

    for (let i = 0; i < localData.value.length; i++) {
        const d = localData.value[i]!
        if (d.skipped) continue
        const ex = allExercises.value[i]
        if (!ex) continue

        if (ex.type === 'strength') {
            if (!d.sets.some(s => s.completed)) continue
            const strengthMode = (ex as StrengthExercise).mode ?? 'reps+weight'
            exercises.push({
                exerciseId: d.exerciseId,
                exerciseName: ex.name,
                strengthMode,
                sets: d.sets.filter(s => s.completed).map(s => ({
                    reps: strengthMode !== 'time' ? (s.reps ?? 0) : undefined,
                    weight: strengthMode === 'reps+weight' ? s.weight : undefined,
                    duration: strengthMode === 'time' ? s.duration : undefined,
                })),
                note: d.note || undefined,
                muscleGroups: (ex as any).muscleGroups?.length ? [...(ex as any).muscleGroups] : undefined,
            })
        } else {
            if (!d.completed) continue
            exercises.push({
                exerciseId: d.exerciseId,
                exerciseName: ex.name,
                duration: d.duration,
                metricValue: d.metricValue,
                note: d.note || undefined,
                muscleGroups: (ex as any).muscleGroups?.length ? [...(ex as any).muscleGroups] : undefined,
            })
        }
    }

    const durationSeconds = Math.round((Date.now() - sessionStartTime.value) / 1000)
    await sessionStore.completeSession(workoutId.value, exercises, durationSeconds, workout.value?.name)

    // Back-propagate completed values into the workout template (only for original workout exercises)
    if (workout.value) {
        const workoutExs = workout.value.exercises
        for (let i = 0; i < workoutExs.length; i++) {
            const d = localData.value[i]
            if (!d || d.skipped) continue
            const ex = workoutExs[i]
            if (!ex) continue

            if (ex.type === 'strength') {
                const completedSets = d.sets.filter(s => s.completed)
                if (completedSets.length === 0) continue
                const strengthMode = (ex as StrengthExercise).mode ?? 'reps+weight'
                await workoutStore.updateExercise(workoutId.value, i, {
                    ...ex,
                    sets: d.sets.map((s, si) => ({
                        reps: strengthMode !== 'time' ? (s.reps ?? ex.sets[si]?.reps ?? 0) : undefined,
                        weight: strengthMode === 'reps+weight' ? s.weight : undefined,
                        duration: strengthMode === 'time' ? (s.duration ?? ex.sets[si]?.duration) : undefined,
                    })),
                })
            } else {
                if (!d.completed) continue
                await workoutStore.updateExercise(workoutId.value, i, {
                    ...ex,
                    duration: d.duration ?? ex.duration,
                    metricValue: d.metricValue ?? ex.metricValue,
                })
            }
        }
    }

    saving.value = false
    clearDraft()
    activeSession.clear()
    router.back()
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-4">
        <div v-if="!workout || localData.length === 0" class="flex justify-center py-20">
            <IconLoaderCircle class="size-12 animate-spin text-primary-500" />
        </div>

        <template v-else>
            <!-- Top gradient shadow when timer is visible -->
            <Transition
                enter-active-class="transition-opacity duration-300"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="timer.isRunning.value || timer.hasEnded.value"
                    class="fixed inset-x-0 top-12 h-40 bg-linear-to-b from-bg via-bg/40 to-transparent pointer-events-none z-9"
                />
            </Transition>

            <!-- Pause Timer Banner -->
            <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div v-if="timer.isRunning.value || timer.hasEnded.value" :class="['bg-card rounded-2xl px-4 py-3 flex items-center justify-between sticky top-4 z-10 shadow-md shadow-black/30 border', timer.hasEnded.value ? 'border-orange-500/50' : 'border-primary-500/50']">
                    <div class="flex items-center gap-3">
                        <IconTimer :class="['size-5 shrink-0', timer.hasEnded.value ? 'text-orange-400' : 'text-primary-400']" />
                        <div>
                            <div class="text-xs text-text-muted font-medium uppercase tracking-wide">
                                {{ timer.hasEnded.value ? 'Pause vorbei' : 'Pause' }}
                            </div>
                            <div :class="['text-2xl font-bold leading-tight', timer.hasEnded.value ? 'text-orange-400' : 'text-primary-400']">
                                {{ timer.hasEnded.value ? timer.formattedElapsed.value : timer.formattedRemaining.value }}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="timer.reset()"
                            class="text-xs bg-surface hover:bg-surface-hover border border-border text-text rounded-lg px-3 py-1.5 transition-colors font-semibold"
                        >
                            Neu starten
                        </button>
                        <button
                            @click="timer.stop()"
                            class="text-text-muted hover:text-text transition-colors p-1.5"
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

            <!-- Add exercise during session -->
            <button
                @click="showExercisePicker = true"
                class="w-full flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary-500/60 text-text-muted hover:text-primary-400 rounded-xl py-3 text-sm font-medium transition-colors"
            >
                <IconPlus class="size-4" />
                Übung hinzufügen
            </button>

            <button
                @click="finish"
                :disabled="saving || doneCount === 0"
                class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <IconLoaderCircle v-if="saving" class="size-4 animate-spin" />
                Session abschließen
            </button>

            <button
                @click="showAbandonDialog = true"
                class="w-full text-red-400 hover:text-red-300 text-sm font-medium py-2 transition-colors"
            >
                Training abbrechen
            </button>
        </template>

        <!-- Exercise picker (session mode) -->
        <ExercisePickerModal
            v-if="showExercisePicker"
            :sessionMode="true"
            @close="showExercisePicker = false"
            @select="handleExerciseSelected"
        />

        <!-- Abandon dialog -->
        <Teleport to="body">
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="showAbandonDialog" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <Transition
                        appear
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 scale-95"
                        enter-to-class="opacity-100 scale-100"
                    >
                        <div class="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-sm w-full">
                            <h3 class="font-semibold text-lg text-text">Training abbrechen?</h3>
                            <p class="text-sm text-text-muted">Der Fortschritt dieser Session wird verworfen und kann nicht wiederhergestellt werden.</p>
                            <div class="flex gap-3">
                                <button
                                    @click="showAbandonDialog = false"
                                    class="flex-1 bg-surface text-text hover:bg-surface-hover rounded-xl py-2.5 font-semibold text-sm transition-colors"
                                >
                                    Weitertrainieren
                                </button>
                                <button
                                    @click="confirmAbandon"
                                    class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

