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

        async updateExercise(exercise: Exercise) {
            const index = this.exercises.findIndex(e => e.id === exercise.id)
            if (index === -1) return
            this.exercises[index] = exercise
            await db.exercises.put(JSON.parse(JSON.stringify(toRaw(exercise))))
            useToast().addToast('Übung aktualisiert')
        },

        async deleteExercise(id: string) {
            const ex = this.exercises.find(e => e.id === id)
            this.exercises = this.exercises.filter(e => e.id !== id)
            await db.exercises.delete(id)
            if (ex) useToast().addToast(`"${ex.name}" gelöscht`, 'info')
        },
    },
})
