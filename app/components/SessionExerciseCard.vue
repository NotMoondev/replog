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

const metricLabel = computed(() => {
    if (props.exercise.type !== 'cardio') return ''
    if (props.exercise.metric === 'intensity') return 'Intensität'
    if (props.exercise.metric === 'speed') return 'km/h'
    return ''
})

const isPartiallyDone = computed(() => {
    if (props.exercise.type === 'strength') return props.modelValue.sets.some(s => s.completed)
    return props.modelValue.completed
})
</script>

<template>
    <div
        class="bg-card border rounded-2xl p-4 space-y-3 transition-colors"
        :class="isPartiallyDone ? 'border-primary-500/50' : 'border-border'"
    >
        <!-- Header -->
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-medium">{{ exercise.name }}</h3>
                <span class="text-xs text-text-muted">{{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}</span>
            </div>
        </div>

        <!-- Strength: sets -->
        <div v-if="exercise.type === 'strength'" class="space-y-2">
            <div v-for="(set, i) in modelValue.sets" :key="i" class="flex items-center gap-2">
                <input
                    type="checkbox"
                    :checked="set.completed"
                    @change="updateSet(i, { completed: ($event.target as HTMLInputElement).checked })"
                    class="w-5 h-5 accent-primary-500 shrink-0"
                />

                <span class="text-sm text-text-muted w-12 shrink-0">Set {{ i + 1 }}</span>

                <div class="flex gap-2 flex-1">
                    <div class="flex-1">
                        <input
                            type="number"
                            :value="set.reps"
                            @input="updateSet(i, { reps: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                            placeholder="Reps"
                            class="w-full bg-neutral-700 rounded-lg p-2 text-sm outline-none"
                        />
                        <div v-if="lastSet(i)?.reps != null" class="text-xs text-neutral-500 pl-1 mt-0.5">
                            Letztes Mal: {{ lastSet(i)?.reps }} reps
                        </div>
                    </div>

                    <div class="flex-1">
                        <input
                            type="number"
                            :value="set.weight"
                            @input="updateSet(i, { weight: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                            placeholder="kg"
                            class="w-full bg-neutral-700 rounded-lg p-2 text-sm outline-none"
                        />
                        <div v-if="lastSet(i)?.weight != null" class="text-xs text-neutral-500 pl-1 mt-0.5">
                            Letztes Mal: {{ lastSet(i)?.weight }}kg
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cardio -->
        <div v-else class="space-y-3">
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    :checked="modelValue.completed"
                    @change="update({ completed: ($event.target as HTMLInputElement).checked })"
                    class="w-5 h-5 accent-primary-500"
                />
                <span class="text-sm text-text-muted">Erledigt</span>
            </label>

            <div class="flex gap-2">
                <div class="flex-1">
                    <input
                        type="number"
                        :value="modelValue.duration"
                        @input="update({ duration: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                        placeholder="Dauer (Sek)"
                        class="w-full bg-neutral-700 rounded-lg p-2 text-sm outline-none"
                    />
                    <div v-if="lastExercise?.duration != null" class="text-xs text-neutral-500 pl-1 mt-0.5">
                        Letztes Mal: {{ lastExercise.duration }}s
                    </div>
                </div>

                <div v-if="exercise.metric !== 'none'" class="flex-1">
                    <input
                        type="number"
                        :value="modelValue.metricValue"
                        @input="update({ metricValue: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                        :placeholder="metricLabel"
                        class="w-full bg-neutral-700 rounded-lg p-2 text-sm outline-none"
                    />
                    <div v-if="lastExercise?.metricValue != null" class="text-xs text-neutral-500 pl-1 mt-0.5">
                        Letztes Mal: {{ lastExercise.metricValue }} {{ metricLabel }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
