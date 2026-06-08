<script setup lang="ts">
import type { CardioExercise } from '~/types/workout'
import type { WorkoutSessionExercise } from '~/types/session'
import { useExerciseStore } from '~/stores/useExerciseStore'
import { useSessionStore } from '~/stores/useSessionStore'
import { useActiveSession } from '~/composables/useActiveSession'
import { PRESET_EXERCISES } from '~/utils/presetExercises'
import { secondsToDisplay, displayToSeconds, autoUnit } from '~/utils/duration'

const route = useRoute()
const router = useRouter()
const exerciseStore = useExerciseStore()
const sessionStore = useSessionStore()
const activeSession = useActiveSession()

const exerciseId = computed(() => route.params.exerciseId as string)

// Synthetic workoutId for session storage
const sessionKey = computed(() => `exercise:${exerciseId.value}`)
const draftKey = computed(() => `replog-session-draft-${sessionKey.value}`)

const exercise = computed<CardioExercise | null>(() => {
    const fromStore = exerciseStore.exercises.find(e => e.id === exerciseId.value)
    if (fromStore && fromStore.type === 'cardio') return fromStore as CardioExercise
    const fromPreset = PRESET_EXERCISES.find(e => e.id === exerciseId.value)
    if (fromPreset && fromPreset.type === 'cardio') return fromPreset as CardioExercise
    return null
})

const duration = ref<number | undefined>(undefined)
const metricValue = ref<number | undefined>(undefined)
const completed = ref(false)
const saving = ref(false)
const sessionStartTime = ref(0)
const showAbandonDialog = ref(false)

const lastSession = ref<WorkoutSessionExercise | null>(null)

const durationUnit = computed(() => duration.value != null ? autoUnit(duration.value) : 'min')
const durationDisplay = computed({
    get: () => secondsToDisplay(duration.value, durationUnit.value),
    set: (v) => { duration.value = displayToSeconds(v, durationUnit.value) },
})

const metricLabel = computed(() => {
    if (!exercise.value) return ''
    switch (exercise.value.metric) {
        case 'speed': return 'Tempo (km/h)'
        case 'intensity': return 'Intensität (%)'
        default: return ''
    }
})

function saveDraft() {
    if (!completed.value && duration.value == null) return
    try {
        localStorage.setItem(draftKey.value, JSON.stringify({
            duration: duration.value,
            metricValue: metricValue.value,
            completed: completed.value,
            elapsedSeconds: sessionStartTime.value > 0
                ? Math.round((Date.now() - sessionStartTime.value) / 1000)
                : 0,
        }))
    } catch { /* quota exceeded */ }
}

function clearDraft() {
    localStorage.removeItem(draftKey.value)
}

function restoreDraft(): boolean {
    try {
        const raw = localStorage.getItem(draftKey.value)
        if (!raw) return false
        const draft = JSON.parse(raw)
        duration.value = draft.duration
        metricValue.value = draft.metricValue
        completed.value = draft.completed ?? false
        const elapsedMs = (draft.elapsedSeconds ?? 0) * 1000
        sessionStartTime.value = Date.now() - elapsedMs
        return true
    } catch {
        return false
    }
}

watch([duration, metricValue, completed], saveDraft)

const exerciseLoaded = ref(false)

onMounted(async () => {
    await exerciseStore.loadExercises()
    exerciseLoaded.value = true
    const last = await sessionStore.getLastSessionForWorkout(sessionKey.value)
    lastSession.value = last?.exercises[0] ?? null
    if (!restoreDraft()) {
        sessionStartTime.value = Date.now()
        if (exercise.value) {
            duration.value = lastSession.value?.duration ?? exercise.value.duration
            metricValue.value = lastSession.value?.metricValue ?? exercise.value.metricValue
        }
    }
    activeSession.set(sessionKey.value, exercise.value?.name ?? '')
})

watch(exercise, (ex) => {
    if (ex && duration.value == null) {
        duration.value = lastSession.value?.duration ?? ex.duration
        metricValue.value = lastSession.value?.metricValue ?? ex.metricValue
    }
})

async function finish() {
    if (!exercise.value) return
    saving.value = true
    const exerciseData: WorkoutSessionExercise = {
        exerciseId: exercise.value.id,
        exerciseName: exercise.value.name,
        duration: duration.value,
        metricValue: metricValue.value ?? undefined,
        muscleGroups: exercise.value.muscleGroups?.length ? [...exercise.value.muscleGroups] : undefined,
    }
    const durationSeconds = Math.round((Date.now() - sessionStartTime.value) / 1000)
    const session = await sessionStore.completeSession(
        sessionKey.value,
        [exerciseData],
        durationSeconds,
        exercise.value.name,
    )
    // Back-propagate duration/metric to exercise store
    await exerciseStore.updateExercise({
        ...exercise.value,
        duration: duration.value ?? exercise.value.duration,
        metricValue: metricValue.value,
    }, true)
    saving.value = false
    clearDraft()
    activeSession.clear()
    router.replace(`/sessions/${session.id}`)
}

function confirmAbandon() {
    showAbandonDialog.value = false
    clearDraft()
    activeSession.clear()
    router.back()
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-4">
        <div v-if="!exerciseLoaded" class="flex justify-center py-20">
            <IconLoaderCircle class="size-12 animate-spin text-primary-500" />
        </div>

        <div v-else-if="!exercise" class="text-center py-20 space-y-4">
            <IconAlertCircle class="size-12 text-red-400 mx-auto" />
            <div>
                <h2 class="text-lg font-semibold text-text">Übung nicht gefunden</h2>
                <p class="text-sm text-text-muted mt-1">Übung-ID: {{ exerciseId }}</p>
            </div>
            <button
                @click="router.back()"
                class="inline-block bg-surface border border-border text-text rounded-xl px-4 py-2 font-semibold text-sm transition-colors"
            >
                Zurück
            </button>
        </div>

        <template v-else>
            <div>
                <h1 class="text-2xl font-semibold">{{ exercise.name }}</h1>
                <p class="text-sm text-text-muted">Cardio-Session</p>
            </div>

            <!-- Cardio card -->
            <div class="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div class="flex items-center gap-2 text-primary-400">
                    <IconHeartPulse class="size-5" />
                    <span class="font-medium text-sm">Cardio</span>
                </div>

                <!-- Duration -->
                <div class="space-y-1">
                    <label class="text-xs text-text-muted font-medium">Dauer</label>
                    <div class="flex gap-2 items-center">
                        <input
                            v-model.number="durationDisplay"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            class="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
                        />
                        <span class="text-sm text-text-muted">{{ durationUnit }}</span>
                        <span v-if="lastSession?.duration" class="ml-auto text-xs text-text-muted">
                            Zuletzt: {{ secondsToDisplay(lastSession.duration, autoUnit(lastSession.duration)) }} {{ autoUnit(lastSession.duration) }}
                        </span>
                    </div>
                </div>

                <!-- Metric -->
                <div v-if="exercise.metric !== 'none'" class="space-y-1">
                    <label class="text-xs text-text-muted font-medium">{{ metricLabel }}</label>
                    <div class="flex gap-2 items-center">
                        <input
                            v-model.number="metricValue"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            class="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors"
                        />
                        <span v-if="lastSession?.metricValue" class="ml-auto text-xs text-text-muted">
                            Zuletzt: {{ lastSession.metricValue }}
                        </span>
                    </div>
                </div>

                <!-- Done toggle -->
                <button
                    @click="completed = !completed"
                    class="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-sm transition-colors"
                    :class="completed
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-surface text-text-muted border border-border hover:text-text'"
                >
                    <IconCircleCheck class="size-4" />
                    {{ completed ? 'Erledigt' : 'Als erledigt markieren' }}
                </button>
            </div>

            <!-- Finish -->
            <button
                :disabled="!completed || saving"
                @click="finish"
                class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
                <span v-if="saving"><IconLoaderCircle class="size-4 animate-spin inline mr-1" />Speichern…</span>
                <span v-else>Session abschließen</span>
            </button>

            <button
                @click="showAbandonDialog = true"
                class="w-full text-red-400 hover:text-red-300 text-sm font-medium py-2 transition-colors"
            >
                Training abbrechen
            </button>
        </template>

        <!-- Abandon dialog -->
        <div
            v-if="showAbandonDialog"
            class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
            @click.self="showAbandonDialog = false"
        >
            <div class="bg-card border border-border rounded-2xl p-5 w-full max-w-sm space-y-4">
                <h2 class="font-semibold text-lg">Training abbrechen?</h2>
                <p class="text-sm text-text-muted">Der Fortschritt geht verloren.</p>
                <div class="flex gap-3">
                    <button
                        @click="showAbandonDialog = false"
                        class="flex-1 bg-surface border border-border text-text rounded-xl py-2.5 font-semibold text-sm transition-colors"
                    >
                        Weiter
                    </button>
                    <button
                        @click="confirmAbandon"
                        class="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl py-2.5 font-semibold text-sm transition-colors"
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
