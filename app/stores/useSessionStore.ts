import { defineStore } from 'pinia'
import { db } from '~/utils/db'
import type { WorkoutSession, WorkoutSessionExercise } from '~/types/session'

export function computeVolume(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (ex.sets) {
            for (const set of ex.sets) {
                total += (set.reps ?? 0) * (set.weight ?? 0)
            }
        }
    }
    return total
}

/** Total reps across bodyweight sets (no weight recorded). */
export function computeRepsVolume(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (!ex.sets || ex.sets.length === 0) continue
        if (ex.strengthMode === 'time') continue
        const isBodyweight =
            ex.strengthMode === 'reps' || ex.sets.every(s => (s.weight ?? 0) === 0)
        if (!isBodyweight) continue
        for (const set of ex.sets) {
            total += set.reps ?? 0
        }
    }
    return total
}

/** Score for cardio exercises: sum(duration_seconds * max(metricValue, 1)). */
export function computeCardioScore(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (ex.sets) continue // skip strength exercises
        if (ex.duration == null) continue
        total += ex.duration * Math.max(ex.metricValue ?? 1, 1)
    }
    return total
}

/** Total cardio duration in seconds. */
export function computeCardioDuration(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (ex.sets) continue
        total += ex.duration ?? 0
    }
    return total
}

export const useSessionStore = defineStore('sessions', {
    state: () => ({
        sessions: [] as WorkoutSession[],
        allSessions: [] as WorkoutSession[],
        loading: false,
    }),

    actions: {
        async loadSessionsForWorkout(workoutId: string) {
            this.loading = true
            const all = await db.sessions.where('workoutId').equals(workoutId).toArray()
            this.sessions = all.sort((a, b) => a.date.localeCompare(b.date))
            this.loading = false
        },

        async getLastSessionForWorkout(workoutId: string): Promise<WorkoutSession | null> {
            const all = await db.sessions.where('workoutId').equals(workoutId).toArray()
            if (!all.length) return null
            const sorted = all.sort((a, b) => a.date.localeCompare(b.date))
            return sorted[sorted.length - 1] ?? null
        },

        async loadAllSessions() {
            this.loading = true
            const all = await db.sessions.toArray()
            this.allSessions = all.sort((a, b) => b.date.localeCompare(a.date))
            this.loading = false
        },

        async completeSession(workoutId: string, exercises: WorkoutSessionExercise[], durationSeconds?: number, workoutName?: string): Promise<WorkoutSession> {
            const session: WorkoutSession = {
                id: crypto.randomUUID(),
                workoutId,
                workoutName,
                date: new Date().toISOString(),
                durationSeconds,
                exercises,
            }
            await db.sessions.add(session)
            this.sessions.push(session)
            if (this.allSessions.length > 0) {
                this.allSessions.unshift(session)
            }
            useToast().addToast('Session gespeichert 💪')
            return session
        },
    },
})
