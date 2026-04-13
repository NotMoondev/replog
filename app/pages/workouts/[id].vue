<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import type { Exercise } from '~/types/workout'
import { useActiveSession } from '~/composables/useActiveSession'

const route = useRoute()
const router = useRouter()
const store = useWorkoutStore()
const activeSession = useActiveSession()
const { showConflict, navigateTo, confirmDiscard, confirmResume, cancel: cancelConflict } = activeSession.useConflictGuard()

const workout = computed(() =>
    store.workouts.find(w => w.id === route.params.id)
)

const showModal = ref(false)
const showPicker = ref(false)
const editingExercise = ref<{ exercise: Exercise; index: number } | null>(null)
const confirmingDelete = ref(false)

function handleStartWorkout() {
    if (!workout.value) return
    navigateTo(workout.value.id, workout.value.name)
}

function discardAndStart() {
    confirmDiscard()
}

function resumeActiveSession() {
    confirmResume()
}

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

async function handleClone() {
    if (!workout.value) return
    await store.cloneWorkout(workout.value.id)
    router.back()
}

async function handleDelete() {
    if (!workout.value) return
    await store.deleteWorkout(workout.value.id)
    router.replace('/workouts')
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6 relative">
        <div v-if="!workout">
            <IconLoaderCircle class="size-18 animate-spin absolute translate-y-1/2 left-0 right-0 mx-auto" />
        </div>

        <template v-else>
            <!-- Active session banner -->
            <div
                v-if="activeSession.isActive.value && activeSession.meta.value?.workoutId === workout.id"
                class="bg-primary-500/10 border border-primary-500/30 rounded-xl px-4 py-3 flex items-center justify-between"
            >
                <div class="flex items-center gap-2 text-primary-400">
                    <IconPlay class="size-4 shrink-0" />
                    <span class="text-sm font-medium">Session läuft noch</span>
                </div>
                <NuxtLink
                    :to="`/session/${workout.id}`"
                    class="text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors"
                >
                    Fortsetzen
                </NuxtLink>
            </div>
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
            <button
                @click="handleStartWorkout"
                class="w-full bg-primary-500 hover:bg-primary-600 rounded-xl py-3 font-semibold text-sm text-center flex items-center justify-center gap-2 transition-colors"
            >
                <IconPlay class="w-5 h-5" />
                {{ activeSession.isActive.value && activeSession.meta.value?.workoutId === workout.id ? 'Session fortsetzen' : 'Workout starten' }}
            </button>

            <button @click="showPicker = true"
                class="w-full bg-surface hover:bg-surface-hover rounded-xl py-3 font-semibold text-sm transition-colors">
                + Übung hinzufügen
            </button>

            <!-- Secondary actions -->
            <div class="flex gap-2">
                <button
                    @click="handleClone"
                    class="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border rounded-xl py-2.5 px-4 text-sm font-medium transition-colors text-text-muted hover:text-text"
                    title="Duplizieren"
                >
                    <IconCopy class="size-4" />
                </button>
                <template v-if="confirmingDelete">
                    <button
                        @click="handleDelete"
                        class="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors"
                    >
                        Löschen
                    </button>
                    <button
                        @click="confirmingDelete = false"
                        class="flex items-center justify-center bg-surface hover:bg-surface-hover border border-border rounded-xl py-2.5 px-3 transition-colors text-text-muted hover:text-text"
                    >
                        <IconX class="size-4" />
                    </button>
                </template>
                <button
                    v-else
                    @click="confirmingDelete = true"
                    class="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border rounded-xl py-2.5 px-4 text-sm font-medium transition-colors text-text-muted hover:text-red-400"
                    title="Workout löschen"
                >
                    <IconTrash2 class="size-4" />
                </button>
            </div>

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

    <!-- Session conflict dialog -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="showConflict" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <Transition
                    appear
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                >
                    <div class="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-sm w-full">
                        <h3 class="font-semibold text-lg text-text">Session läuft noch</h3>
                        <p class="text-sm text-text-muted">
                            Du hast noch eine aktive Session für
                            <span class="font-semibold text-text">„{{ activeSession.meta.value?.workoutName }}“</span>.
                            Was möchtest du tun?
                        </p>
                        <div class="flex flex-col gap-2">
                            <button
                                @click="resumeActiveSession"
                                class="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
                            >
                                Aktive Session fortsetzen
                            </button>
                            <button
                                @click="discardAndStart"
                                class="w-full bg-surface hover:bg-surface-hover border border-border text-text rounded-xl py-2.5 font-semibold text-sm transition-colors"
                            >
                                Session verwerfen &amp; neu starten
                            </button>
                            <button
                                @click="cancelConflict"
                                class="w-full text-text-muted hover:text-text text-sm py-1.5 transition-colors"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

