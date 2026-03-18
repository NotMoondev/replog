import { defineStore } from 'pinia'
import { db } from '~~/server/db'
import type { Workout } from '~~/types/workout'

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

        async addExercise(workoutId: string, exercise: any) {
            const workout = this.workouts.find(w => w.id === workoutId)
            if (!workout) return

            workout.exercises.push(exercise)

            await db.workouts.put(workout)
        }
    },
})
