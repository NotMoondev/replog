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
            useToast().addToast(`"${name}" erstellt`)
        },

        async deleteWorkout(id: string) {
            const workout = this.workouts.find(w => w.id === id)
            await db.workouts.delete(id)
            this.workouts = this.workouts.filter(w => w.id !== id)
            if (workout) useToast().addToast(`"${workout.name}" gelöscht`, 'info')
        },

        async addExercise(workoutId: string, exercise: Exercise) {
            const workout = this.workouts.find(w => w.id === workoutId)
            if (!workout) return
            workout.exercises.push(exercise)
            await db.workouts.put(JSON.parse(JSON.stringify(toRaw(workout))))
            useToast().addToast('Übung hinzugefügt')
        },

        async updateExercise(workoutId: string, exerciseIndex: number, updated: Exercise) {
            const workout = this.workouts.find(w => w.id === workoutId)
            if (!workout) return
            workout.exercises[exerciseIndex] = updated
            await db.workouts.put(JSON.parse(JSON.stringify(toRaw(workout))))
            useToast().addToast('Übung aktualisiert')
        },

        async deleteExercise(workoutId: string, exerciseId: string) {
            const workout = this.workouts.find(w => w.id === workoutId)
            if (!workout) return
            workout.exercises = workout.exercises.filter(e => e.id !== exerciseId)
            await db.workouts.put(JSON.parse(JSON.stringify(toRaw(workout))))
            useToast().addToast('Übung gelöscht', 'info')
        },

        async renameWorkout(id: string, name: string) {
            const workout = this.workouts.find(w => w.id === id)
            if (!workout) return
            workout.name = name
            await db.workouts.put(JSON.parse(JSON.stringify(toRaw(workout))))
            useToast().addToast('Workout umbenannt')
        },

        async cloneWorkout(id: string) {
            const original = this.workouts.find(w => w.id === id)
            if (!original) return
            const clone: Workout = JSON.parse(JSON.stringify(toRaw(original)))
            clone.id = crypto.randomUUID()
            clone.name = `${original.name} (Kopie)`
            clone.createdAt = new Date().toISOString()
            clone.exercises = clone.exercises.map((e: Exercise) => ({ ...e, id: crypto.randomUUID() }))
            await db.workouts.add(clone)
            this.workouts.push(clone)
            useToast().addToast(`"${clone.name}" erstellt`)
        },
    },
})

