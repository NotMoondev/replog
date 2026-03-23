<script setup lang="ts">
import type { Exercise } from '~/types/workout'
import type { WorkoutSessionExercise } from '~/types/session'

interface LocalSet {
    reps?: number
    weight?: number
    completed: boolean
}

interface LocalExercise {
    exerciseId: string
    completed: boolean
    sets: LocalSet[]
    duration?: number
    metricValue?: number
}

const props = defineProps<{
    exercise: Exercise
    lastExercise?: WorkoutSessionExercise | null
    modelValue: LocalExercise
}>()

const emit = defineEmits<{
    'update:modelValue': [LocalExercise]
}>()

function update(patch: Partial<LocalExercise>) {
    emit('update:modelValue', { ...props.modelValue, ...patch })
}

function updateSet(index: number, patch: Partial<LocalSet>) {
    const newSets = [...props.modelValue.sets]
    const existing = newSets[index]!
    newSets[index] = { ...existing, ...patch, completed: patch.completed ?? existing.completed }
    update({ sets: newSets })
}

function lastSet(index: number) {
    return props.lastExercise?.sets?.[index]
}

function copyFromPrevSet(index: number) {
    const prev = props.modelValue.sets[index - 1]
    if (!prev) return
    updateSet(index, { reps: prev.reps, weight: prev.weight })
}

const metricLabel = computed(() => {
    if (props.exercise.type !== 'cardio') return ''
    if (props.exercise.metric === 'intensity') return 'Intensität'
    if (props.exercise.metric === 'speed') return 'km/h'
    return ''
})

// Derive unit from exercise default (use min if exercise duration is a whole minute)
const durationUnit = computed((): 's' | 'min' => {
    if (props.exercise.type !== 'cardio') return 's'
    const d = (props.exercise as any).duration ?? 0
    return d >= 60 && d % 60 === 0 ? 'min' : 's'
})

const durationDisplay = computed({
    get(): number | undefined {
        const v = props.modelValue.duration
        if (v == null) return undefined
        return durationUnit.value === 'min' ? Math.round(v / 60 * 100) / 100 : v
    },
    set(val: number | undefined) {
        const secs = val == null || isNaN(val as number)
            ? undefined
            : durationUnit.value === 'min' ? Math.round((val as number) * 60) : (val as number)
        update({ duration: secs })
    },
})

const isPartiallyDone = computed(() => {
    if (props.exercise.type === 'strength') return props.modelValue.sets.some(s => s.completed)
    return props.modelValue.completed
})
</script>

<template>
    <div class="bg-card border rounded-2xl p-4 space-y-3 transition-colors"
        :class="isPartiallyDone ? 'border-primary-500/50' : 'border-border'">
        <!-- Header -->
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-medium">{{ exercise.name }}</h3>
                <span class="text-xs text-text-muted">{{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}</span>
            </div>
        </div>

        <!-- Strength: sets -->
        <div v-if="exercise.type === 'strength'" class="space-y-2">
            <div v-for="(set, i) in modelValue.sets" :key="i" class="flex items-center gap-2 transition-opacity"
                :class="set.completed ? 'opacity-50' : ''">
                <input type="checkbox" :checked="set.completed"
                    @change="updateSet(i, { completed: ($event.target as HTMLInputElement).checked })"
                    class="w-4 h-4 accent-primary-500 shrink-0" />

                <span class="text-xs text-text-muted w-10 shrink-0">Set {{ i + 1 }}</span>

                <div class="flex gap-2 flex-1">
                    <input type="number" :value="set.reps"
                        @input="updateSet(i, { reps: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                        placeholder="Wdh"
                        class="w-full bg-neutral-800 border border-border rounded-xl px-2.5 py-2 text-sm outline-none focus:border-primary-500 transition-colors" />
                    <input type="number" :value="set.weight"
                        @input="updateSet(i, { weight: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                        placeholder="kg"
                        class="w-full bg-neutral-800 border border-border rounded-xl px-2.5 py-2 text-sm outline-none focus:border-primary-500 transition-colors" />
                    <button v-if="i > 0 && (modelValue.sets[i - 1]?.reps != null || modelValue.sets[i - 1]?.weight != null)"
                        @click="copyFromPrevSet(i)"
                        class="shrink-0 text-text-muted hover:text-primary-400 transition-colors"
                        title="Vom vorherigen Set übernehmen">
                        <IconCopy class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Cardio -->
        <div v-else class="space-y-3">
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" :checked="modelValue.completed"
                    @change="update({ completed: ($event.target as HTMLInputElement).checked })"
                    class="w-4 h-4 accent-primary-500" />
                <span class="text-sm text-text-muted">Erledigt</span>
            </label>

            <div class="flex gap-2" :class="modelValue.completed ? 'opacity-50' : ''">
                <div class="relative flex-1">
                    <input type="number" :value="durationDisplay"
                        @input="durationDisplay = ($event.target as HTMLInputElement).valueAsNumber || undefined"
                        :placeholder="durationUnit === 'min' ? 'Min' : 'Sek'"
                        class="w-full bg-neutral-800 border border-border rounded-xl px-2.5 py-2 pr-12 text-sm outline-none focus:border-primary-500 transition-colors" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                        {{ durationUnit === 'min' ? 'min' : 's' }}
                    </span>
                </div>

                <input v-if="exercise.metric !== 'none'" type="number" :value="modelValue.metricValue"
                    @input="update({ metricValue: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                    :placeholder="metricLabel"
                    class="w-full bg-neutral-800 border border-border rounded-xl px-2.5 py-2 text-sm outline-none focus:border-primary-500 transition-colors" />
            </div>
        </div>
    </div>
</template>
