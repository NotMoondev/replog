import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { db } from '~/utils/db'
import type { Workout, Exercise } from '~/types/workout'

export const useWorkoutStore = defineStore('workouts', {
    state: () => ({
        workouts: [] as Workout[],
        loading: false,
    }),

    actions: {
        async loadWorkouts() {
            this.loading = true
            this.workouts = await db.workouts.toArray()
            this.loading = false
        },

        async createWorkout(name: string) {
            const workout: Workout = {
                id: crypto.randomUUID(),
                name,
                exercises: [],
                createdAt: new Date().toISOString(),
            }

            await db.workouts.add(workout)
            this.workouts.push(workout)
        },

        async deleteWorkout(id: string) {
            await db.workouts.delete(id)
            this.workouts = this.workouts.filter(w => w.id !== id)
        },

        async addExercise(workoutId: string, exercise: Exercise) {
            const workout = this.workouts.find(w => w.id === workoutId)
            if (!workout) return

            workout.exercises.push(exercise)

            // JSON-Roundtrip entfernt alle Vue-Proxy-Wrapper auf allen Ebenen (exercises, sets, …)
            await db.workouts.put(JSON.parse(JSON.stringify(toRaw(workout))))
        }
    },
})
