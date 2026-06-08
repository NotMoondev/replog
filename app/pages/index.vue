<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'
import { useSessionStore } from '~/stores/useSessionStore'
import { useExerciseStore } from '~/stores/useExerciseStore'
import { computeVolume, computeSessionScore, computeProgressiveOverload, computeRelativeIntensity } from '~/utils/metrics'
import { useActiveSession } from '~/composables/useActiveSession'
import { useFormatters } from '~/composables/useFormatters'
import { usePreferredMetric } from '~/composables/usePreferredMetric'
import { PRESET_EXERCISES } from '~/utils/presetExercises'
import type { WorkoutSessionExercise } from '~/types/session'
import type { CardioExercise } from '~/types/workout'

const store = useWorkoutStore()
const planStore = useTrainingPlanStore()
const sessionStore = useSessionStore()
const exerciseStore = useExerciseStore()
const activeSession = useActiveSession()
const { showConflict, navigateTo, navigateToExercise, confirmDiscard, confirmResume, cancel: cancelConflict } = activeSession.useConflictGuard()
const { formatSessionDate, formatVolume } = useFormatters()
const { preferred } = usePreferredMetric()

const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

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

const todayCardioExercise = computed<CardioExercise | null>(() => {
    const eid = planStore.todayCardioExerciseId
    if (!eid) return null
    const fromStore = exerciseStore.exercises.find(e => e.id === eid)
    if (fromStore?.type === 'cardio') return fromStore as CardioExercise
    const fromPreset = PRESET_EXERCISES.find(e => e.id === eid)
    if (fromPreset?.type === 'cardio') return fromPreset as CardioExercise
    return null
})

const todaySession = computed(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    if (todayWorkout.value) {
        return sessionStore.allSessions.find(s => {
            const sessionDate = new Date(s.date)
            return s.workoutId === todayWorkout.value!.id &&
                   sessionDate >= todayStart &&
                   sessionDate <= todayEnd
        }) ?? null
    }

    if (todayCardioExercise.value) {
        const key = `exercise:${todayCardioExercise.value.id}`
        return sessionStore.allSessions.find(s => {
            const sessionDate = new Date(s.date)
            return s.workoutId === key &&
                   sessionDate >= todayStart &&
                   sessionDate <= todayEnd
        }) ?? null
    }

    return null
})

const weekDays = computed(() => {
    if (!planStore.activePlan) return []
    return planStore.activePlan.days.map((day, i) => {
        const cardioExercise = day.cardioExerciseId
            ? (exerciseStore.exercises.find(e => e.id === day.cardioExerciseId)
                ?? PRESET_EXERCISES.find(e => e.id === day.cardioExerciseId)
                ?? null)
            : null
        return {
            label: WEEKDAYS_SHORT[i],
            weekday: i,
            isRestDay: day.isRestDay,
            isCardio: !day.isRestDay && day.dayMode === 'cardio',
            workout: day.workoutId ? store.workouts.find(w => w.id === day.workoutId) ?? null : null,
            cardioExercise,
            isToday: i === planStore.todayWeekday,
        }
    })
})

// ── Metrics ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
    const d = new Date(date)
    // Monday-based
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}
function buildPrevMap(sessionIndex: number): Map<string, WorkoutSessionExercise> {
    const map = new Map<string, WorkoutSessionExercise>()
    const session = sessionStore.allSessions[sessionIndex]
    if (!session) return map
    for (const ex of session.exercises) {
        for (const older of sessionStore.allSessions.slice(sessionIndex + 1)) {
            const found = older.exercises.find(e => e.exerciseId === ex.exerciseId)
            if (found) { map.set(ex.exerciseId, found); break }
        }
    }
    return map
}

function sessionMetricValue(sessionIndex: number): string {
    const session = sessionStore.allSessions[sessionIndex]
    if (!session) return '—'
    switch (preferred.value) {
        case 'volume': {
            const vol = computeVolume(session.exercises)
            return vol > 0 ? formatVolume(vol) : '—'
        }
        case 'session': {
            const score = computeSessionScore(session.exercises, buildPrevMap(sessionIndex)).score
            return String(score)
        }
        case 'overload': {
            const r = computeProgressiveOverload(session.exercises, buildPrevMap(sessionIndex))
            return r.totalTrackedCount > 0 ? `${r.score}%` : '–'
        }
        case 'intensity': {
            const r = computeRelativeIntensity(session.exercises)
            return r.exerciseCount > 0 ? `${r.avgPercent}%` : '—'
        }
    }
}

const weeklyPreferredMetric = computed(() => {
    const allSessions = sessionStore.allSessions
    const now = new Date()
    const thisWeekStart = startOfWeek(now).getTime()
    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000
    const thisSessions = allSessions.filter(s => new Date(s.date).getTime() >= thisWeekStart)
    const lastSessions = allSessions.filter(s => {
        const t = new Date(s.date).getTime()
        return t >= lastWeekStart && t < thisWeekStart
    })

    function aggregate(sessions: typeof allSessions): number | null {
        if (sessions.length === 0) return null
        let total = 0
        for (const s of sessions) {
            const idx = allSessions.indexOf(s)
            switch (preferred.value) {
                case 'volume': total += computeVolume(s.exercises); break
                case 'session': total += computeSessionScore(s.exercises, buildPrevMap(idx)).score; break
                case 'overload': total += computeProgressiveOverload(s.exercises, buildPrevMap(idx)).score; break
                case 'intensity': total += computeRelativeIntensity(s.exercises).avgPercent; break
            }
        }
        return preferred.value === 'volume' ? total : Math.round(total / sessions.length)
    }

    const thisVal = aggregate(thisSessions)
    const lastVal = aggregate(lastSessions)
    const delta = thisVal !== null && lastVal !== null && lastVal > 0
        ? Math.round(((thisVal - lastVal) / lastVal) * 100)
        : null
    return { thisVal, lastVal, delta }
})

const weeklyPreferredFormatted = computed(() => {
    const val = weeklyPreferredMetric.value.thisVal
    if (val === null || val === 0) return '—'
    if (preferred.value === 'volume') return formatVolume(val)
    if (preferred.value === 'session') return String(val)
    return `${val}%`
})

const weeklyPreferredLabel = computed(() => {
    switch (preferred.value) {
        case 'session': return '∅ Trainingsscore'
        case 'volume': return 'Volumen diese Woche'
        case 'overload': return '∅ Overload'
        case 'intensity': return '∅ Intensität'
    }
})

const sessionsThisWeek = computed(() => {
    const start = startOfWeek(new Date()).getTime()
    return sessionStore.allSessions.filter(s => new Date(s.date).getTime() >= start).length
})

const totalVolume = computed(() =>
    sessionStore.allSessions.reduce((sum, s) => sum + computeVolume(s.exercises), 0)
)

const recentSessions = computed(() =>
    sessionStore.allSessions.slice(0, 3)
)

function workoutName(workoutId: string): string {
    return store.allWorkouts.find(w => w.id === workoutId)?.name ?? 'Workout'
}


onMounted(async () => {
    await Promise.all([
        store.loadWorkouts(),
        planStore.loadPlans(),
        sessionStore.loadAllSessions(),
        exerciseStore.loadExercises(),
    ])
})
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-5">
        <!-- Header -->
        <div class="flex justify-between items-center pt-1">
            <div>
                <h3 id="app-logo" class="font-black italic text-3xl">REPLOG</h3>
                <p class="text-text-muted text-sm capitalize">{{ today }}</p>
            </div>
            <NuxtLink to="/settings" class="p-2 text-text-muted hover:text-text transition-colors">
                <IconSettings class="size-5" />
            </NuxtLink>
        </div>

        <!-- Onboarding hint -->
        <div
            v-if="store.workouts.length === 0 && !planStore.activePlan"
            class="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 space-y-1"
        >
            <p class="text-sm font-semibold text-primary-400">👋 Willkommen bei REPLOG!</p>
            <p class="text-xs text-text-muted">
                Erstelle zuerst ein
                <NuxtLink to="/workouts" class="text-primary-400 underline underline-offset-2">Workout</NuxtLink>,
                dann einen
                <NuxtLink to="/plan" class="text-primary-400 underline underline-offset-2">Trainingsplan</NuxtLink>
                und starte durch.
            </p>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold">{{ store.workouts.length }}</div>
                <div class="text-xs text-text-muted mt-0.5">Workouts</div>
            </div>
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold">{{ sessionStore.allSessions.length }}</div>
                <div class="text-xs text-text-muted mt-0.5">Sessions</div>
            </div>
        </div>

        <!-- Today's Training Card -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Heutiges Training</p>

            <div v-if="!planStore.activePlan" class="text-sm text-text-muted">
                Kein Trainingsplan aktiv.
                <NuxtLink to="/plan" class="text-primary-400 hover:text-primary-300 transition-colors">Plan erstellen</NuxtLink>
            </div>

            <div v-else-if="planStore.todayIsRestDay" class="flex items-center gap-2 text-text-muted">
                <IconBedDouble class="size-4" />
                <span class="text-sm">Ruhetag, erhole dich gut!</span>
            </div>

            <div v-else-if="todayWorkout" class="space-y-3">
                <div>
                    <div class="font-semibold">{{ todayWorkout.name }}</div>
                    <div class="text-xs text-text-muted">{{ todayWorkout.exercises.length }} Übungen</div>
                </div>

                <!-- Already completed today -->
                <div v-if="todaySession" class="space-y-2">
                    <div class="flex items-center gap-2 text-green-400">
                        <IconCircleCheck class="size-5" />
                        <span class="text-sm font-medium">Training erfolgreich abgeschlossen!</span>
                    </div>
                    <p class="text-xs text-text-muted">
                        Großartig! Du hast dein Training für heute getrackt. Weiter so!
                    </p>
                    <NuxtLink
                        :to="`/sessions/${todaySession.id}`"
                        class="block w-full bg-surface hover:bg-border text-text text-center rounded-xl py-2.5 font-semibold text-sm transition-colors"
                    >
                        Session anzeigen
                    </NuxtLink>
                </div>

                <!-- Not yet started -->
                <button
                    v-else
                    @click="navigateTo(todayWorkout.id, todayWorkout.name)"
                    class="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center rounded-xl py-2.5 font-semibold text-sm transition-colors"
                >
                    Training starten
                </button>
            </div>

            <div v-else-if="todayCardioExercise" class="space-y-3">
                <div class="flex items-center gap-2">
                    <IconHeartPulse class="size-4 text-primary-400" />
                    <div>
                        <div class="font-semibold">{{ todayCardioExercise.name }}</div>
                        <div class="text-xs text-text-muted">Cardio</div>
                    </div>
                </div>

                <!-- Already completed today -->
                <div v-if="todaySession" class="space-y-2">
                    <div class="flex items-center gap-2 text-green-400">
                        <IconCircleCheck class="size-5" />
                        <span class="text-sm font-medium">Training erfolgreich abgeschlossen!</span>
                    </div>
                    <NuxtLink
                        :to="`/sessions/${todaySession.id}`"
                        class="block w-full bg-surface hover:bg-border text-text text-center rounded-xl py-2.5 font-semibold text-sm transition-colors"
                    >
                        Session anzeigen
                    </NuxtLink>
                </div>

                <button
                    v-else
                    @click="navigateToExercise(todayCardioExercise.id, todayCardioExercise.name)"
                    class="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center rounded-xl py-2.5 font-semibold text-sm transition-colors"
                >
                    Training starten
                </button>
            </div>

            <div v-else class="text-sm text-text-muted">
                Kein Workout für heute eingetragen.
                <NuxtLink to="/plan" class="text-primary-400 hover:text-primary-300 transition-colors">Plan bearbeiten</NuxtLink>
            </div>
        </div>

        <!-- Weekly plan overview -->
        <div v-if="planStore.activePlan" class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Diese Woche</p>
            <div class="grid grid-cols-7 gap-1.5">
                <div
                    v-for="day in weekDays"
                    :key="day.weekday"
                    class="flex flex-col items-center gap-1"
                >
                    <span
                        class="text-[10px] font-medium"
                        :class="day.isToday ? 'text-primary-400' : 'text-text-muted'"
                    >
                        {{ day.label }}
                    </span>
                    <div
                        class="w-full aspect-square rounded-lg flex items-center justify-center transition-colors"
                        :class="[
                            day.isToday
                                ? 'bg-primary-500 ring-2 ring-primary-500/30'
                                : day.isRestDay
                                    ? 'bg-surface'
                                    : 'bg-primary-500/20',
                        ]"
                        :title="day.isRestDay ? 'Ruhetag' : (day.workout?.name ?? 'Kein Workout')"
                    >
                        <IconBedDouble
                            v-if="day.isRestDay"
                            class="size-3"
                            :class="day.isToday ? 'text-white' : 'text-text-muted'"
                        />
                        <IconHeartPulse
                            v-else-if="day.isCardio"
                            class="size-3"
                            :class="day.isToday ? 'text-white' : 'text-primary-400'"
                        />
                        <IconDumbbell
                            v-else
                            class="size-3"
                            :class="day.isToday ? 'text-white' : 'text-primary-400'"
                        />
                    </div>
                    <span
                        v-if="!day.isRestDay && (day.workout || day.cardioExercise)"
                        class="text-[9px] text-center leading-tight w-full truncate text-text-muted"
                    >
                        {{ day.workout?.name ?? day.cardioExercise?.name }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Weekly metrics -->
        <div v-if="sessionStore.allSessions.length > 0" class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Fortschritt</p>
            <div class="grid grid-cols-2 gap-3">
                <!-- Preferred weekly metric -->
                <div class="space-y-1">
                    <div class="text-xs text-text-muted">{{ weeklyPreferredLabel }}</div>
                    <div class="font-bold text-lg leading-tight">{{ weeklyPreferredFormatted }}</div>
                    <div class="flex items-center gap-1 text-xs">
                        <template v-if="weeklyPreferredMetric.delta !== null">
                            <span :class="weeklyPreferredMetric.delta >= 0 ? 'text-green-400' : 'text-red-400'" class="font-semibold">
                                {{ weeklyPreferredMetric.delta >= 0 ? '+' : '' }}{{ weeklyPreferredMetric.delta }}%
                            </span>
                            <span class="text-text-muted">vs. Vorwoche</span>
                        </template>
                        <span v-else class="text-text-muted">Erste Woche</span>
                    </div>
                </div>
                <!-- Sessions this week -->
                <div class="space-y-1">
                    <div class="text-xs text-text-muted">Sessions diese Woche</div>
                    <div class="font-bold text-lg leading-tight">{{ sessionsThisWeek }}</div>
                    <div class="text-xs text-text-muted">Trainingseinheiten</div>
                </div>
            </div>
            <!-- Total volume -->
            <div class="border-t border-border pt-3 flex justify-between items-center">
                <span class="text-xs text-text-muted">Gesamtvolumen aller Zeiten</span>
                <span class="font-semibold text-sm">{{ formatVolume(totalVolume) }}</span>
            </div>
        </div>

        <!-- Recent Sessions -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Letzte Sessions</p>

            <div v-if="recentSessions.length === 0" class="text-sm text-text-muted">
                Noch keine Sessions absolviert.
            </div>

            <div v-else class="space-y-2">
                <NuxtLink
                    v-for="(s, si) in recentSessions"
                    :key="s.id"
                    :to="`/sessions/${s.id}`"
                    class="flex justify-between items-center py-1.5 hover:opacity-80 transition-opacity"
                >
                    <div class="min-w-0">
                        <div class="text-sm font-medium truncate">{{ workoutName(s.workoutId) }}</div>
                        <div class="text-xs text-text-muted">{{ s.exercises.length }} Übungen · {{ formatSessionDate(s.date) }}</div>
                    </div>
                    <span class="text-xs font-semibold shrink-0 ml-3">{{ sessionMetricValue(si) }}</span>
                </NuxtLink>
            </div>

            <NuxtLink v-if="sessionStore.allSessions.length > 3" to="/sessions" class="block text-xs text-primary-400 hover:text-primary-300 transition-colors pt-1">
                Alle Sessions anzeigen →
            </NuxtLink>
        </div>
    </div>

    <SessionConflictDialog
        :show="showConflict"
        @resume="confirmResume"
        @discard="confirmDiscard"
        @cancel="cancelConflict"
    />
</template>
