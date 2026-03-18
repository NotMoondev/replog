<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '~/stores/useWorkoutStore'

const store = useWorkoutStore()
const router = useRouter()

const name = ref('')

async function createWorkout() {
    if (!name.value.trim()) return

    await store.createWorkout(name.value)
    name.value = ''

    // Direkt zum Detail der neuen Workout-Seite navigieren
    const created = store.workouts[store.workouts.length - 1]
    router.push(`/workouts/${created?.id}`)
}
</script>

<template>
    <div class="min-h-screen bg-bg text-text p-4 space-y-6">
        <h1 class="text-2xl font-semibold">Neues Workout erstellen</h1>

        <div class="bg-card border border-border rounded-2xl p-4 space-y-4">
            <input v-model="name" placeholder="Workout Name"
                class="w-full bg-neutral-800 rounded-xl p-3 text-sm outline-none" />

            <button @click="createWorkout"
                class="w-full bg-primary-500 hover:bg-primary-600 rounded-2xl py-3 text-white font-medium transition">
                Workout erstellen
            </button>
        </div>
    </div>
</template>
