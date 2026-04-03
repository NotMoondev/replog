<script setup lang="ts">
import { useExerciseStore } from '~/stores/useExerciseStore'
import type { Exercise } from '~/types/workout'

const store = useExerciseStore()
const showCreateModal = ref(false)
const editingExercise = ref<Exercise | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const searchQuery = ref('')

const filteredExercises = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return store.exercises
    return store.exercises.filter(e => e.name.toLowerCase().includes(q))
})

function formatDuration(secs: number): string {
    if (secs >= 60 && secs % 60 === 0) return `${secs / 60} min`
    if (secs >= 60) return `${(secs / 60).toFixed(1)} min`
    return `${secs} s`
}

onMounted(() => {
    store.loadExercises()
})

async function handleDelete(id: string) {
    await store.deleteExercise(id)
    confirmingDeleteId.value = null
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold">Übungen</h1>
            <button
                @click="showCreateModal = true"
                class="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 font-semibold text-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
                <IconPlus class="size-4" /> Erstellen
            </button>
        </div>

        <!-- Search -->
        <div class="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
            <IconSearch class="size-4 text-text-muted shrink-0" />
            <input
                v-model="searchQuery"
                placeholder="Suchen…"
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="text-text-muted hover:text-text transition-colors">
                <IconX class="size-4" />
            </button>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <!-- Exercise List -->
        <div v-else class="space-y-3">
            <div v-for="ex in filteredExercises" :key="ex.id"
                class="bg-card border border-border rounded-2xl p-4">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-semibold text-sm truncate">{{ ex.name }}</h3>
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                                :class="ex.type === 'strength' ? 'bg-primary-500/20 text-primary-400' : 'bg-blue-500/20 text-blue-400'">
                                {{ ex.type === 'strength' ? 'Kraft' : 'Cardio' }}
                            </span>
                        </div>
                        <!-- Strength: set chips -->
                        <div v-if="ex.type === 'strength'" class="flex flex-wrap gap-1.5">
                            <div v-for="(set, i) in ex.sets" :key="i"
                                class="flex items-center gap-1.5 bg-surface rounded-lg px-2.5 py-1 text-xs">
                                <span class="text-text-muted">{{ i + 1 }}</span>
                                <span class="font-medium">{{ set.reps }}<span class="text-text-muted font-normal"> reps</span></span>
                                <template v-if="set.weight">
                                    <span class="text-text-muted">·</span>
                                    <span class="text-primary-400">{{ set.weight }}<span class="text-text-muted font-normal"> kg</span></span>
                                </template>
                            </div>
                        </div>
                        <!-- Cardio: stat pills -->
                        <div v-if="ex.type === 'cardio'" class="flex flex-wrap gap-1.5">
                            <div class="flex items-center gap-1.5 bg-surface rounded-lg px-2.5 py-1 text-xs">
                                <IconTimer class="w-3 h-3 text-blue-400" />
                                <span class="font-medium">{{ formatDuration(ex.duration) }}</span>
                            </div>
                            <div v-if="ex.metric !== 'none' && ex.metricValue != null"
                                class="flex items-center gap-1.5 bg-surface rounded-lg px-2.5 py-1 text-xs">
                                <span class="font-medium">{{ ex.metricValue }}</span>
                                <span class="text-text-muted">{{ ex.metric === 'speed' ? 'km/h' : 'Intensität' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <button @click="editingExercise = ex" class="text-text-muted hover:text-primary-400 transition-colors">
                            <IconPencil class="size-4" />
                        </button>
                        <template v-if="confirmingDeleteId === ex.id">
                            <button
                                @click="handleDelete(ex.id)"
                                class="text-red-400 hover:text-red-300 text-sm font-medium transition px-1"
                            >
                                Löschen
                            </button>
                            <button @click="confirmingDeleteId = null" class="text-text-muted hover:text-text transition">
                                <IconX class="size-3.5" />
                            </button>
                        </template>
                        <button
                            v-else
                            @click="confirmingDeleteId = ex.id"
                            class="text-text-muted hover:text-red-400 transition-colors"
                        >
                            <IconTrash2 class="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="store.exercises.length === 0" class="text-center py-16 space-y-2">
                <IconListChecks class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Übungen in der Bibliothek.</p>
                <p class="text-xs text-text-muted">Klicke auf "Erstellen" um loszulegen.</p>
            </div>
            <div v-else-if="filteredExercises.length === 0" class="text-center py-16 space-y-2">
                <IconSearch class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Keine Übungen gefunden.</p>
            </div>
        </div>

        <!-- Create Modal -->
        <ExerciseModal v-if="showCreateModal" @close="showCreateModal = false" />

        <!-- Edit Modal -->
        <ExerciseModal
            v-if="editingExercise"
            @close="editingExercise = null"
            :initialExercise="editingExercise"
        />
    </div>
</template>
