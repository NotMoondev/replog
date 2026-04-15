import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { db } from '~/utils/db'
import type { Exercise } from '~/types/workout'

export const useExerciseStore = defineStore('exercises', {
    state: () => ({
        exercises: [] as Exercise[],
        loading: false,
    }),

    actions: {
        async loadExercises() {
            this.loading = true
            this.exercises = await db.exercises.toArray()
            this.loading = false
        },

        async createExercise(exercise: Exercise) {
            const raw: Exercise = JSON.parse(JSON.stringify(toRaw(exercise)))
            await db.exercises.add(raw)
            this.exercises.push(raw)
            useToast().addToast(`"${raw.name}" erstellt`)
        },

        async updateExercise(exercise: Exercise, silent = false) {
            const raw: Exercise = JSON.parse(JSON.stringify(toRaw(exercise)))
            const index = this.exercises.findIndex(e => e.id === exercise.id)
            if (index === -1) {
                // First-time override of a preset exercise
                this.exercises.push(raw)
                await db.exercises.add(raw)
            } else {
                this.exercises[index] = raw
                await db.exercises.put(raw)
            }
            if (!silent) useToast().addToast('Übung aktualisiert')
        },

        async deleteExercise(id: string) {
            const ex = this.exercises.find(e => e.id === id)
            this.exercises = this.exercises.filter(e => e.id !== id)
            await db.exercises.delete(id)
            if (ex) useToast().addToast(`"${ex.name}" gelöscht`, 'info')
        },
    },
})
