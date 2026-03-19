import { defineStore } from 'pinia'
import { db } from '~/utils/db'
import type { WorkoutSession, WorkoutSessionExercise } from '~/types/session'

export const useSessionStore = defineStore('sessions', {
    state: () => ({
        sessions: [] as WorkoutSession[],
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

        async completeSession(workoutId: string, exercises: WorkoutSessionExercise[]): Promise<WorkoutSession> {
            const session: WorkoutSession = {
                id: crypto.randomUUID(),
                workoutId,
                date: new Date().toISOString(),
                exercises,
            }
            await db.sessions.add(session)
            this.sessions.push(session)
            return session
        },
    },
})
