<script setup lang="ts">
import { useSessionStore } from '~/stores/useSessionStore'
import { computeSessionScore } from '~/utils/metrics'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useFormatters } from '~/composables/useFormatters'
import type { WorkoutSessionExercise } from '~/types/session'

const sessionStore = useSessionStore()
const workoutStore = useWorkoutStore()
const { formatDate, formatDuration } = useFormatters()

onMounted(async () => {
    await Promise.all([
        sessionStore.loadAllSessions(),
        workoutStore.loadWorkouts(),
    ])
})

function workoutName(workoutId: string, sessionIndex: number): string {
    return workoutStore.workouts.find(w => w.id === workoutId)?.name
        ?? sessionStore.allSessions[sessionIndex]?.workoutName
        ?? 'Unbekanntes Workout'
}

// Für jede Session: Map exerciseId → letzte vorherige Instanz dieser Übung
const sessionScores = computed(() =>
    sessionStore.allSessions.map((session, i) => {
        const prevMap = new Map<string, WorkoutSessionExercise>()
        const olderSessions = sessionStore.allSessions.slice(i + 1)

        for (const ex of session.exercises) {
            for (const older of olderSessions) {
                const found = older.exercises.find(e => e.exerciseId === ex.exerciseId)
                if (found) { prevMap.set(ex.exerciseId, found); break }
            }
        }

        return computeSessionScore(session.exercises, prevMap)
    })
)

function scoreColor(score: number): string {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-teal-400'
    if (score >= 55) return 'text-sky-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
}

function scoreZoneLabel(score: number): string {
    if (score >= 85) return 'Sehr stark'
    if (score >= 70) return 'Gut'
    if (score >= 55) return 'Solide'
    if (score >= 40) return 'Okay'
    return 'Schwach'
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6 pb-28">
        <h1 class="text-2xl font-semibold">Sessions</h1>

        <div v-if="sessionStore.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <div v-else class="space-y-3">
            <NuxtLink v-for="(session, i) in sessionStore.allSessions" :key="session.id" :to="`/sessions/${session.id}`"
                class="block bg-card border border-border rounded-2xl p-4 hover:border-surface-hover transition-colors">
                <template v-if="sessionScores[i]">
                    <div class="flex justify-between items-start gap-3">
                        <div class="min-w-0">
                            <div class="font-semibold text-sm truncate">{{ workoutName(session.workoutId, i) }}</div>
                            <div class="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                                <span>{{ formatDate(session.date) }}</span>
                                <span v-if="formatDuration(session.durationSeconds)" class="flex items-center gap-1">
                                    <IconClock class="size-3" />
                                    {{ formatDuration(session.durationSeconds) }}
                                </span>
                            </div>
                        </div>

                        <div class="shrink-0 text-right">
                            <template v-if="sessionScores[i]">
                                <span class="text-sm font-semibold" :class="scoreColor(sessionScores[i].score)">
                                    {{ sessionScores[i].score }}
                                </span>
                                <div class="text-xs" :class="scoreColor(sessionScores[i].score)">
                                    {{ scoreZoneLabel(sessionScores[i].score) }}
                                </div>
                            </template>
                            <template v-else>
                                <span class="text-sm text-text-muted">—</span>
                            </template>
                        </div>
                    </div>

                    <div class="mt-2 text-xs text-text-muted">
                        {{ session.exercises.length }} Übungen
                    </div>
                </template>
            </NuxtLink>

            <div v-if="sessionStore.allSessions.length === 0" class="text-center py-16 space-y-2">
                <IconClipboardList class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Sessions vorhanden.</p>
                <p class="text-xs text-text-muted">Starte dein erstes Workout!</p>
            </div>
        </div>
    </div>
</template>