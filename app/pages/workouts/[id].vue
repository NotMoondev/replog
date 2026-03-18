<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'

const route = useRoute()
const store = useWorkoutStore()

const workout = computed(() =>
    store.workouts.find(w => w.id === route.params.id)
)

const showModal = ref(false)

onMounted(() => {
    store.loadWorkouts()
})
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6 relative">
        <div v-if="!workout">
            <IconLoaderCircle class="size-18 animate-spin absolute translate-y-1/2 left-0 right-0 mx-auto" />
        </div>

        <template v-else>
            <!-- Header -->
            <div>
                <h1 class="text-2xl font-semibold">{{ workout.name }}</h1>
                <p class="text-text-muted text-sm">
                    {{ workout.exercises.length }} Übungen
                </p>
            </div>

            <!-- Exercises -->
            <div class="space-y-3">
                <ExerciseCard v-for="ex in workout.exercises" :key="ex.id" :exercise="ex" />
            </div>

            <!-- Add Button -->
            <button @click="showModal = true"
                class="w-full bg-primary-500 hover:bg-primary-600 rounded-2xl py-3 font-medium">
                + Übung hinzufügen
            </button>

            <!-- Modal -->
            <ExerciseModal v-if="showModal" @close="showModal = false" :workoutId="workout.id" />
        </template>
    </div>
</template>
