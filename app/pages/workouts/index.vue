<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'

const store = useWorkoutStore()
const newName = ref('')
const confirmingDeleteId = ref<string | null>(null)

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
        <div class="flex gap-2">
            <input
                v-model="newName"
                placeholder="Neues Workout"
                @keyup.enter="create"
                class="flex-1 bg-neutral-800 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
            />
            <button
                @click="create"
                class="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
                <IconPlus class="size-4" /> Erstellen
            </button>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <!-- Workout List -->
        <div v-else class="space-y-3">
            <div v-for="w in store.workouts" :key="w.id"
                class="bg-card border border-border rounded-2xl p-4 flex justify-between items-center hover:border-neutral-700 transition-colors">

                <div>
                    <div class="font-semibold text-sm">{{ w.name }}</div>
                    <div class="text-xs text-text-muted">
                        {{ w.exercises.length }} Übungen
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Clone -->
                    <button
                        @click="store.cloneWorkout(w.id)"
                        class="text-text-muted hover:text-primary-400 transition-colors"
                        title="Duplizieren"
                    >
                        <IconCopy class="size-4" />
                    </button>

                    <!-- Delete with inline confirm -->
                    <template v-if="confirmingDeleteId === w.id">
                        <button
                            @click="store.deleteWorkout(w.id); confirmingDeleteId = null"
                            class="text-red-400 hover:text-red-300 text-sm font-medium transition"
                        >
                            Löschen
                        </button>
                        <button @click="confirmingDeleteId = null" class="text-text-muted hover:text-text transition">
                            <IconX class="size-4" />
                        </button>
                    </template>
                    <button
                        v-else
                        @click="confirmingDeleteId = w.id"
                        class="text-text-muted hover:text-red-400 transition-colors"
                    >
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

            <!-- Empty state -->
            <div v-if="store.workouts.length === 0" class="text-center py-16 space-y-2">
                <IconDumbbell class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Workouts vorhanden.</p>
                <p class="text-xs text-neutral-600">Erstelle dein erstes Workout oben.</p>
            </div>
        </div>
    </div>
</template>

