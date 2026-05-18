<script setup lang="ts">
import { useSessionStore } from '~/stores/useSessionStore'
import { computeVolume, computeRepsVolume, computeCardioScore } from '~/utils/metrics'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useFormatters } from '~/composables/useFormatters'

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


function volumeDelta(sessionIndex: number): { value: number; percent: number; label: string } | null {
    const session = sessionStore.allSessions[sessionIndex]
    if (!session) return null

    const prevSession = sessionStore.allSessions
        .slice(sessionIndex + 1)
        .find(s => s.workoutId === session.workoutId)
    if (!prevSession) return null

    // 1. Weighted volume (priority)
    const currentVol = computeVolume(session.exercises)
    const prevVol = computeVolume(prevSession.exercises)
    if (currentVol > 0 && prevVol > 0) {
        const diff = currentVol - prevVol
        return { value: diff, percent: Math.round((diff / prevVol) * 100), label: 'Volumen' }
    }

    // 2. Cardio score
    const currentCardio = computeCardioScore(session.exercises)
    const prevCardio = computeCardioScore(prevSession.exercises)
    if (currentCardio > 0 && prevCardio > 0) {
        const diff = currentCardio - prevCardio
        return { value: diff, percent: Math.round((diff / prevCardio) * 100), label: 'Cardio' }
    }

    // 3. Bodyweight reps
    const currentReps = computeRepsVolume(session.exercises)
    const prevReps = computeRepsVolume(prevSession.exercises)
    if (currentReps > 0 && prevReps > 0) {
        const diff = currentReps - prevReps
        return { value: diff, percent: Math.round((diff / prevReps) * 100), label: 'Reps' }
    }

    return null
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6 pb-28">
        <h1 class="text-2xl font-semibold">Sessions</h1>

        <div v-if="sessionStore.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <div v-else class="space-y-3">
            <NuxtLink
                v-for="(session, i) in sessionStore.allSessions"
                :key="session.id"
                :to="`/sessions/${session.id}`"
                class="block bg-card border border-border rounded-2xl p-4 hover:border-surface-hover transition-colors"
            >
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
                        <template v-if="volumeDelta(i) !== null">
                            <span
                                class="text-sm font-semibold"
                                :class="volumeDelta(i)!.percent >= 0 ? 'text-green-400' : 'text-red-400'"
                            >
                                {{ volumeDelta(i)!.percent >= 0 ? '+' : '' }}{{ volumeDelta(i)!.percent }}%
                            </span>
                            <div class="text-xs text-text-muted">{{ volumeDelta(i)!.label }}</div>
                        </template>
                        <template v-else>
                            <span class="text-sm text-text-muted">—</span>
                        </template>
                    </div>
                </div>

                <div class="mt-2 text-xs text-text-muted">
                    {{ session.exercises.length }} Übungen
                </div>
            </NuxtLink>

            <div v-if="sessionStore.allSessions.length === 0" class="text-center py-16 space-y-2">
                <IconClipboardList class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Sessions vorhanden.</p>
                <p class="text-xs text-text-muted">Starte dein erstes Workout!</p>
            </div>
        </div>
    </div>
</template>
