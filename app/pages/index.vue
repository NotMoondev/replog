<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'
import { useSessionStore, computeVolume } from '~/stores/useSessionStore'

const store = useWorkoutStore()
const planStore = useTrainingPlanStore()
const sessionStore = useSessionStore()

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

const weekDays = computed(() => {
    if (!planStore.activePlan) return []
    return planStore.activePlan.days.map((day, i) => ({
        label: WEEKDAYS_SHORT[i],
        weekday: i,
        isRestDay: day.isRestDay,
        workout: day.workoutId ? store.workouts.find(w => w.id === day.workoutId) ?? null : null,
        isToday: i === planStore.todayWeekday,
    }))
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

const weeklyVolume = computed(() => {
    const now = new Date()
    const thisWeekStart = startOfWeek(now).getTime()
    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000
    let thisVol = 0
    let lastVol = 0
    for (const s of sessionStore.allSessions) {
        const t = new Date(s.date).getTime()
        if (t >= thisWeekStart) thisVol += computeVolume(s.exercises)
        else if (t >= lastWeekStart) lastVol += computeVolume(s.exercises)
    }
    return { thisVol, lastVol }
})

const weeklyVolumeDelta = computed(() => {
    const { thisVol, lastVol } = weeklyVolume.value
    if (lastVol === 0) return null
    return Math.round(((thisVol - lastVol) / lastVol) * 100)
})

const sessionsThisWeek = computed(() => {
    const start = startOfWeek(new Date()).getTime()
    return sessionStore.allSessions.filter(s => new Date(s.date).getTime() >= start).length
})

const streak = computed(() => {
    if (sessionStore.allSessions.length === 0) return 0
    // Build a set of unique training days (YYYY-MM-DD)
    const days = new Set(
        sessionStore.allSessions.map(s => s.date.slice(0, 10))
    )
    let count = 0
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    // If no session today, start checking from yesterday
    const todayStr = d.toISOString().slice(0, 10)
    if (!days.has(todayStr)) {
        d.setDate(d.getDate() - 1)
    }
    while (true) {
        const key = d.toISOString().slice(0, 10)
        if (!days.has(key)) break
        count++
        d.setDate(d.getDate() - 1)
    }
    return count
})

const totalVolume = computed(() =>
    sessionStore.allSessions.reduce((sum, s) => sum + computeVolume(s.exercises), 0)
)

const recentSessions = computed(() =>
    sessionStore.allSessions.slice(0, 3)
)

function workoutName(workoutId: string): string {
    return store.workouts.find(w => w.id === workoutId)?.name ?? 'Workout'
}

function formatSessionDate(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Heute'
    if (diffDays === 1) return 'Gestern'
    if (diffDays < 7) return `vor ${diffDays} Tagen`
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

function formatVolume(kg: number): string {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')} t`
    return `${kg.toLocaleString('de-DE')} kg`
}

onMounted(async () => {
    await Promise.all([
        store.loadWorkouts(),
        planStore.loadPlans(),
        sessionStore.loadAllSessions(),
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
        <div class="grid grid-cols-3 gap-3">
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold">{{ store.workouts.length }}</div>
                <div class="text-xs text-text-muted mt-0.5">Workouts</div>
            </div>
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold">{{ sessionStore.allSessions.length }}</div>
                <div class="text-xs text-text-muted mt-0.5">Sessions</div>
            </div>
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold flex items-center justify-center gap-1">
                    {{ streak }}
                    <IconFlame v-if="streak >= 3" class="size-5 text-orange-400" />
                </div>
                <div class="text-xs text-text-muted mt-0.5">Tage Streak</div>
            </div>
        </div>

        <!-- Today's Training Card -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Heutiges Training</p>

            <div v-if="!planStore.activePlan" class="text-sm text-text-muted">
                Kein Trainingsplan aktiv. —
                <NuxtLink to="/plan" class="text-primary-400 hover:text-primary-300 transition-colors">Plan erstellen</NuxtLink>
            </div>

            <div v-else-if="planStore.todayIsRestDay" class="flex items-center gap-2 text-text-muted">
                <IconBedDouble class="size-4" />
                <span class="text-sm">Ruhetag — erhole dich gut!</span>
            </div>

            <div v-else-if="todayWorkout" class="space-y-3">
                <div>
                    <div class="font-semibold">{{ todayWorkout.name }}</div>
                    <div class="text-xs text-text-muted">{{ todayWorkout.exercises.length }} Übungen</div>
                </div>
                <NuxtLink
                    :to="`/session/${todayWorkout.id}`"
                    class="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center rounded-xl py-2.5 font-semibold text-sm transition-colors"
                >
                    Training starten
                </NuxtLink>
            </div>

            <div v-else class="text-sm text-text-muted">
                Kein Workout für heute eingetragen. —
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
                        <IconDumbbell
                            v-else
                            class="size-3"
                            :class="day.isToday ? 'text-white' : 'text-primary-400'"
                        />
                    </div>
                    <span
                        v-if="!day.isRestDay && day.workout"
                        class="text-[9px] text-center leading-tight w-full truncate text-text-muted"
                    >
                        {{ day.workout.name }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Weekly metrics -->
        <div v-if="sessionStore.allSessions.length > 0" class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Fortschritt</p>
            <div class="grid grid-cols-2 gap-3">
                <!-- Weekly volume -->
                <div class="space-y-1">
                    <div class="text-xs text-text-muted">Volumen diese Woche</div>
                    <div class="font-bold text-lg leading-tight">{{ formatVolume(weeklyVolume.thisVol) }}</div>
                    <div class="flex items-center gap-1 text-xs">
                        <template v-if="weeklyVolumeDelta !== null">
                            <span :class="weeklyVolumeDelta >= 0 ? 'text-green-400' : 'text-red-400'" class="font-semibold">
                                {{ weeklyVolumeDelta >= 0 ? '+' : '' }}{{ weeklyVolumeDelta }}%
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
                    v-for="s in recentSessions"
                    :key="s.id"
                    :to="`/sessions/${s.id}`"
                    class="flex justify-between items-center py-1.5 hover:opacity-80 transition-opacity"
                >
                    <div class="min-w-0">
                        <div class="text-sm font-medium truncate">{{ workoutName(s.workoutId) }}</div>
                        <div class="text-xs text-text-muted">{{ s.exercises.length }} Übungen</div>
                    </div>
                    <span class="text-xs text-text-muted shrink-0 ml-3">{{ formatSessionDate(s.date) }}</span>
                </NuxtLink>
            </div>

            <NuxtLink v-if="sessionStore.allSessions.length > 3" to="/sessions" class="block text-xs text-primary-400 hover:text-primary-300 transition-colors pt-1">
                Alle Sessions anzeigen →
            </NuxtLink>
        </div>
    </div>
</template>

