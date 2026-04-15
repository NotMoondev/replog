<script setup lang="ts">
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '~/components/ui/drawer'
import { useExerciseStore } from '~/stores/useExerciseStore'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { PRESET_EXERCISES } from '~/utils/presetExercises'
import type { Exercise } from '~/types/workout'

const props = defineProps<{
    workoutId?: string
    sessionMode?: boolean
}>()

const emit = defineEmits<{
    close: []
    select: [Exercise]
}>()

const exerciseStore = useExerciseStore()
const workoutStore = useWorkoutStore()

const searchQuery = ref('')
const showCreateModal = ref(false)
const adding = ref<string | null>(null)
const activeTab = ref<'mine' | 'presets'>('mine')
const activeSnapPoint = ref<number | string | null>(0.5)

onMounted(() => {
    exerciseStore.loadExercises()
})

const filteredExercises = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    const source = activeTab.value === 'presets' ? PRESET_EXERCISES : exerciseStore.exercises
    if (!q) return source
    return source.filter(e => e.name.toLowerCase().includes(q))
})

async function addToWorkout(exercise: Exercise) {
    if (props.sessionMode) {
        emit('select', exercise)
        emit('close')
        return
    }
    adding.value = exercise.id
    const copy: Exercise = JSON.parse(JSON.stringify(exercise))
    // Remember the preset origin so session finish can sync values back
    if (exercise.id.startsWith('preset-')) {
        (copy as any).presetId = exercise.id
    }
    copy.id = crypto.randomUUID()
    await workoutStore.addExercise(props.workoutId!, copy)
    adding.value = null
    emit('close')
}

function onExerciseCreated(exercise: Exercise) {
    if (props.sessionMode) {
        showCreateModal.value = false
        emit('select', exercise)
        emit('close')
    }
}

function onCreateModalClose() {
    showCreateModal.value = false
    if (!props.sessionMode) emit('close')
}

function formatDuration(seconds: number): string {
    if (seconds <= 0) return '0 s'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
    if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`
    return `${s} s`
}

function formatMetric(metric: string, value: number | undefined): string {
    if (metric === 'speed' && value != null) return `${value} km/h`
    if (metric === 'intensity' && value != null) return `Stufe ${value}`
    return ''
}
</script>

<template>
    <Drawer
        :open="true"
        @update:open="(val) => { if (!val) emit('close') }"
        direction="bottom"
        :snap-points="[0.5, 1]"
        v-model:active-snap-point="activeSnapPoint"
        v-bind="({ 'fade-from-index': 0 } as any)"
    >
        <DrawerContent class="data-[vaul-drawer-direction=bottom]:h-dvh data-[vaul-drawer-direction=bottom]:max-h-dvh flex flex-col pb-safe">
            <DrawerHeader class="px-5 pb-0 pt-2 shrink-0">
                <div class="flex justify-between items-center">
                    <DrawerTitle class="font-semibold text-lg">Übung hinzufügen</DrawerTitle>
                    <DrawerClose as-child>
                        <button class="p-1.5 text-text-muted hover:text-text transition-colors">
                            <IconX class="size-5" />
                        </button>
                    </DrawerClose>
                </div>
            </DrawerHeader>

            <!-- Search -->
            <div class="px-5 pt-4 pb-3 shrink-0">
                <div class="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5">
                    <IconSearch class="size-4 text-text-muted shrink-0" />
                    <input
                        v-model="searchQuery"
                        type="search"
                        autocomplete="off"
                        placeholder="Suchen…"
                        class="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                    />
                </div>
            </div>

            <!-- Tabs -->
            <div class="px-5 pb-3 shrink-0 flex gap-2">
                <button
                    @click="activeTab = 'mine'"
                    class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                    :class="activeTab === 'mine' ? 'bg-primary-500 text-white' : 'bg-surface text-text-muted hover:text-text'"
                >
                    Meine Übungen
                </button>
                <button
                    @click="activeTab = 'presets'"
                    class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                    :class="activeTab === 'presets' ? 'bg-primary-500 text-white' : 'bg-surface text-text-muted hover:text-text'"
                >
                    App-Vorlagen
                </button>
            </div>

            <!-- Button: create new (only on "Meine" tab) -->
            <div v-if="activeTab === 'mine'" class="px-5 pb-3 shrink-0">
                <button
                    @click="showCreateModal = true"
                    class="w-full border border-dashed border-primary-500/50 text-primary-400 hover:bg-primary-500/10 rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                    <IconPlus class="size-4" />
                    Neue Übung erstellen
                </button>
            </div>

            <hr class="border-border mx-5 shrink-0" />

            <!-- Exercise list — fills remaining drawer height -->
            <!-- data-vaul-no-drag prevents vaul from interpreting scroll as a snap-point drag -->
            <div data-vaul-no-drag class="flex-1 min-h-0 overflow-y-auto px-5 py-3">
                <div class="space-y-2">
                    <div
                        v-for="ex in filteredExercises"
                        :key="ex.id"
                        class="flex items-center justify-between gap-3 bg-surface/60 border border-border rounded-xl px-4 py-3"
                    >
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-sm truncate">{{ ex.name }}</span>
                                <span class="text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0"
                                    :class="ex.type === 'strength' ? 'bg-primary-500/20 text-primary-400' : 'bg-blue-500/20 text-blue-400'">
                                    {{ ex.type === 'strength' ? 'Kraft' : 'Cardio' }}
                                </span>
                            </div>
                            <p v-if="ex.type === 'strength'" class="text-xs text-text-muted mt-0.5">
                                {{ ex.sets.length }} Sets
                                <template v-if="ex.sets[0]?.reps"> · {{ ex.sets[0].reps }} Reps</template>
                                <template v-if="ex.sets[0]?.weight"> · {{ ex.sets[0].weight }} kg</template>
                            </p>
                            <p v-else class="text-xs text-text-muted mt-0.5">
                                {{ formatDuration(ex.duration) }}<template v-if="formatMetric(ex.metric, ex.metricValue)"> · {{ formatMetric(ex.metric, ex.metricValue) }}</template>
                            </p>
                            <div v-if="ex.muscleGroups?.length" class="flex flex-wrap gap-1 mt-1.5">
                                <span
                                    v-for="mg in ex.muscleGroups"
                                    :key="mg"
                                    class="text-xs px-1.5 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border/50"
                                >{{ mg }}</span>
                            </div>
                        </div>
                        <button
                            @click="addToWorkout(ex)"
                            :disabled="adding === ex.id"
                            class="shrink-0 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg p-2 transition-colors"
                        >
                            <IconLoaderCircle v-if="adding === ex.id" class="size-4 animate-spin" />
                            <IconPlus v-else class="size-4" />
                        </button>
                    </div>

                    <!-- Empty library state -->
                    <div v-if="activeTab === 'mine' && exerciseStore.exercises.length === 0 && !exerciseStore.loading" class="text-center py-8 space-y-1">
                        <p class="text-sm text-text-muted">Noch keine eigenen Übungen.</p>
                        <p class="text-xs text-text-muted">Erstelle eine neue Übung oder wähle aus den App-Vorlagen.</p>
                    </div>

                    <!-- No search results -->
                    <div v-else-if="filteredExercises.length === 0" class="text-center py-8">
                        <p class="text-sm text-text-muted">Keine Übungen gefunden.</p>
                    </div>
                </div>
            </div>
        </DrawerContent>
    </Drawer>

    <!-- Nested modal: create new exercise directly into workout -->
    <ExerciseModal
        v-if="showCreateModal"
        :workoutId="sessionMode ? undefined : workoutId"
        @close="onCreateModalClose"
        @created="onExerciseCreated"
    />
</template>
