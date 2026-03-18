<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'

const store = useWorkoutStore()
const newName = ref('')

onMounted(() => {
    store.loadWorkouts()
})

async function create() {
    const trimmed = newName.value.trim()
    if (!trimmed) return

    await store.createWorkout(trimmed)
    newName.value = ''
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold">Workouts</h1>
        </div>

        <!-- Create Inline -->
        <div class="bg-card border border-border rounded-2xl p-3 flex gap-2">
            <input
                v-model="newName"
                placeholder="Neues Workout"
                class="flex-1 bg-neutral-600 rounded-lg p-2 px-3 text-sm outline-none"
            />
            <button
                @click="create"
                class="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 font-medium transition flex items-center gap-1"
            >
                <IconPlus class="w-4 h-4" /> Erstellen
            </button>
        </div>

        <!-- Workout List -->
        <div class="space-y-3">
            <div v-for="w in store.workouts" :key="w.id"
                class="bg-card border border-border rounded-2xl p-4 flex justify-between items-center">

                <div>
                    <div class="font-medium">{{ w.name }}</div>
                    <div class="text-xs text-text-muted">
                        {{ w.exercises.length }} Übungen
                    </div>
                </div>

                <div class="flex gap-2">
                    <button
                        @click="store.deleteWorkout(w.id)"
                        class="flex items-center gap-1 text-text-muted hover:text-primary-400 text-sm"
                    >
                        Löschen
                        <IconTrash2 class="size-4" />
                    </button>

                    <NuxtLink
                        :to="`/workouts/${w.id}`"
                        class="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-500"
                    >
                        Bearbeiten
                        <IconArrowRight class="size-4" />
                    </NuxtLink>
                </div>
            </div>

            <div v-if="store.workouts.length === 0" class="text-center text-text-muted text-sm py-10">
                Keine Workouts vorhanden
            </div>
        </div>
    </div>
</template>
