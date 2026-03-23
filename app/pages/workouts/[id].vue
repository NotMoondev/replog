<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import type { Exercise } from '~/types/workout'

const route = useRoute()
const store = useWorkoutStore()

const workout = computed(() =>
    store.workouts.find(w => w.id === route.params.id)
)

const showModal = ref(false)
const showPicker = ref(false)
const editingExercise = ref<{ exercise: Exercise; index: number } | null>(null)

// Inline rename
const editingName = ref(false)
const nameInput = ref('')
const nameInputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
    store.loadWorkouts()
})

function startRename() {
    if (!workout.value) return
    nameInput.value = workout.value.name
    editingName.value = true
    nextTick(() => nameInputEl.value?.focus())
}

async function saveName() {
    const trimmed = nameInput.value.trim()
    if (trimmed && workout.value && trimmed !== workout.value.name) {
        await store.renameWorkout(workout.value.id, trimmed)
    }
    editingName.value = false
}

function cancelRename() {
    editingName.value = false
}

function openEditExercise(exercise: Exercise, index: number) {
    editingExercise.value = { exercise, index }
}

async function handleDeleteExercise(exerciseId: string) {
    if (!workout.value) return
    await store.deleteExercise(workout.value.id, exerciseId)
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6 relative">
        <div v-if="!workout">
            <IconLoaderCircle class="size-18 animate-spin absolute translate-y-1/2 left-0 right-0 mx-auto" />
        </div>

        <template v-else>
            <!-- Header with inline rename -->
            <div>
                <div v-if="editingName" class="flex items-center gap-2">
                    <input
                        ref="nameInputEl"
                        v-model="nameInput"
                        @keyup.enter="saveName"
                        @keyup.escape="cancelRename"
                        @blur="saveName"
                        class="text-xl font-semibold bg-surface border border-border rounded-xl px-3 py-1.5 outline-none focus:border-primary-500 transition-colors flex-1 min-w-0"
                    />
                    <button @click="saveName" class="text-primary-400 hover:text-primary-500 shrink-0">
                        <IconCheck class="size-5" />
                    </button>
                    <button @click="cancelRename" class="text-text-muted hover:text-text shrink-0">
                        <IconX class="size-5" />
                    </button>
                </div>
                <div v-else class="flex items-center gap-2 cursor-pointer group" @click="startRename">
                    <h1 class="text-2xl font-semibold">{{ workout.name }}</h1>
                    <IconPencil class="size-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p class="text-text-muted text-sm">
                    {{ workout.exercises.length }} Übungen
                </p>
            </div>

            <!-- Exercises -->
            <div class="space-y-3">
                <ExerciseCard
                    v-for="(ex, index) in workout.exercises"
                    :key="ex.id"
                    :exercise="ex"
                    @edit="openEditExercise(ex, index)"
                    @delete="handleDeleteExercise(ex.id)"
                />
            </div>

            <!-- Empty exercises hint -->
            <div v-if="workout.exercises.length === 0" class="text-center py-6 text-text-muted text-sm">
                Noch keine Übungen. Füge deine erste Übung hinzu.
            </div>

            <!-- Start + Add Buttons -->
            <NuxtLink
                :to="`/session/${workout.id}`"
                class="w-full bg-primary-500 hover:bg-primary-600 rounded-xl py-3 font-semibold text-sm text-center flex items-center justify-center gap-2 transition-colors"
            >
                <IconPlay class="w-5 h-5" />
                Workout starten
            </NuxtLink>

            <button @click="showPicker = true"
                class="w-full bg-surface hover:bg-surface-hover rounded-xl py-3 font-semibold text-sm transition-colors">
                + Übung hinzufügen
            </button>

            <!-- Picker Modal (from library or create new) -->
            <ExercisePickerModal v-if="showPicker" @close="showPicker = false" :workoutId="workout.id" />

            <!-- Add directly Modal (fallback kept for compatibility) -->
            <ExerciseModal v-if="showModal" @close="showModal = false" :workoutId="workout.id" />

            <!-- Edit Modal -->
            <ExerciseModal
                v-if="editingExercise"
                @close="editingExercise = null"
                :workoutId="workout.id"
                :initialExercise="editingExercise.exercise"
                :exerciseIndex="editingExercise.index"
            />
        </template>
    </div>
</template>

