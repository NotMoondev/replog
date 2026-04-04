<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useExerciseStore } from '~/stores/useExerciseStore'

const props = defineProps<{
    workoutId?: string
    initialExercise?: any
    exerciseIndex?: number
}>()

import type { Exercise } from '~/types/workout'

const emit = defineEmits<{
    close: []
    created: [Exercise]
}>()

const workoutStore = useWorkoutStore()
const exerciseStore = useExerciseStore()

// Library mode = no workoutId provided
const isLibraryMode = computed(() => !props.workoutId)
const isEdit = computed(() =>
    isLibraryMode.value
        ? props.initialExercise !== undefined
        : props.initialExercise !== undefined && props.exerciseIndex !== undefined
)

const type = ref<'strength' | 'cardio'>('strength')
const name = ref('')
const nameError = ref(false)

/* Strength */
const sets = ref<Array<{ reps?: number; weight?: number }>>([
    { reps: undefined, weight: undefined }
])

/* Cardio */
const duration = ref<number | undefined>() // always stored as seconds
const durationUnit = ref<'s' | 'min'>('s')
const metric = ref<'intensity' | 'speed' | 'none'>('none')
const metricValue = ref<number | undefined>()

// Displayed value in the chosen unit
const durationDisplay = computed({
    get(): number | undefined {
        if (duration.value == null) return undefined
        return durationUnit.value === 'min'
            ? Math.round(duration.value / 60 * 100) / 100
            : duration.value
    },
    set(val: number | undefined) {
        if (val == null || isNaN(val as number)) {
            duration.value = undefined
        } else {
            duration.value = durationUnit.value === 'min' ? Math.round((val as number) * 60) : (val as number)
        }
    },
})

function switchDurationUnit(unit: 's' | 'min') {
    durationUnit.value = unit
}

onMounted(() => {
    if (props.initialExercise) {
        type.value = props.initialExercise.type
        name.value = props.initialExercise.name
        if (props.initialExercise.type === 'strength') {
            sets.value = props.initialExercise.sets.map((s: any) => ({ reps: s.reps, weight: s.weight }))
        } else {
            const secs: number = props.initialExercise.duration ?? 0
            // auto-select unit: use minutes if stored value is a whole number of minutes >= 60s
            if (secs >= 60 && secs % 60 === 0) {
                durationUnit.value = 'min'
            } else {
                durationUnit.value = 's'
            }
            duration.value = secs
            metric.value = props.initialExercise.metric ?? 'none'
            metricValue.value = props.initialExercise.metricValue
        }
    }
})

async function save() {
    if (!name.value.trim()) {
        nameError.value = true
        return
    }
    nameError.value = false

    const id = props.initialExercise?.id ?? crypto.randomUUID()
    let exercise: any

    if (type.value === 'strength') {
        exercise = {
            id,
            type: 'strength',
            name: name.value.trim(),
            sets: sets.value,
        }
    } else {
        exercise = {
            id,
            type: 'cardio',
            name: name.value.trim(),
            duration: duration.value ?? 0,
            metric: metric.value,
            metricValue: metric.value !== 'none' ? metricValue.value : undefined,
        }
    }

    if (isLibraryMode.value) {
        if (isEdit.value) {
            await exerciseStore.updateExercise(exercise)
        } else {
            await exerciseStore.createExercise(exercise)
            emit('created', exercise)
        }
    } else {
        if (isEdit.value) {
            await workoutStore.updateExercise(props.workoutId!, props.exerciseIndex!, exercise)
        } else {
            await workoutStore.addExercise(props.workoutId!, exercise)
            // Also register in global exercise library
            await exerciseStore.createExercise({ ...exercise, id: crypto.randomUUID() })
            emit('created', exercise)
        }
    }

    emit('close')
}
</script>

<template>
    <div class="fixed inset-0 bg-black/60 flex items-end z-50" @click.self="emit('close')">
        <Transition
            enter-active-class="transition-transform duration-[350ms] ease-out"
            enter-from-class="translate-y-full"
            enter-to-class="translate-y-0"
            appear
        >
            <div class="w-full bg-card rounded-t-2xl p-5 space-y-4">
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-lg">{{ isEdit ? 'Übung bearbeiten' : 'Neue Übung' }}</h2>
                <button @click="emit('close')" class="p-1.5 text-text-muted hover:text-text transition-colors">
                    <IconX class="size-5" />
                </button>
            </div>

            <!-- Type Switch -->
            <div class="flex gap-1.5 bg-surface p-1 rounded-xl">
                <button @click="type = 'strength'" :class="[
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    type === 'strength'
                        ? 'bg-primary-500 text-white'
                        : 'text-text-muted hover:text-text'
                ]">
                    Kraft
                </button>
                <button @click="type = 'cardio'" :class="[
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    type === 'cardio'
                        ? 'bg-primary-500 text-white'
                        : 'text-text-muted hover:text-text'
                ]">
                    Cardio
                </button>
            </div>

            <!-- Name -->
            <input
                v-model="name"
                placeholder="Name"
                class="w-full bg-surface border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                :class="nameError ? 'border-red-500' : 'border-border focus:border-primary-500'"
                @input="nameError = false"
            />

            <hr class="border-border mx-5 shrink-0" />

            <!-- Strength Form -->
            <div v-if="type === 'strength'" class="space-y-3 flex flex-col mb-2">
                <div class="flex flex-col overflow-y-auto max-h-72 space-y-2">
                    <div v-for="(set, i) in sets" :key="i" class="flex gap-2 items-center">

                        <span class="text-xs font-semibold text-text-muted shrink-0 w-10 text-center">{{ i + 1 }}</span>

                        <input v-model.number="set.reps" type="number" placeholder="Reps"
                            class="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors w-full" />

                        <input v-model.number="set.weight" type="number" placeholder="kg"
                            class="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors w-full" />

                        <button @click="sets.splice(i + 1, 0, { reps: set.reps, weight: set.weight })" class="shrink-0 p-1.5 text-text-muted hover:text-primary-400 transition-colors" title="Set duplizieren">
                            <IconCopy class="size-4" />
                        </button>

                        <button @click="sets.splice(i, 1)" class="shrink-0 p-1.5 text-text-muted hover:text-red-400 transition-colors">
                            <IconTrash2 class="size-4" />
                        </button>
                    </div>
                </div>

                <button @click="sets.push({ reps: undefined, weight: undefined })"
                    class="w-full border border-dashed border-border text-text-muted hover:text-primary-400 hover:border-primary-500 rounded-xl py-2.5 text-sm transition-colors">
                    + Set hinzufügen
                </button>
            </div>

            <!-- Cardio Form -->
            <div v-if="type === 'cardio'" class="space-y-3 flex flex-col mb-2 overflow-y-auto max-h-72">
                <!-- Duration with unit toggle -->
                <div class="flex gap-2">
                    <input
                        :value="durationDisplay"
                        @input="durationDisplay = ($event.target as HTMLInputElement).valueAsNumber || undefined"
                        type="number"
                        :placeholder="durationUnit === 'min' ? 'Dauer (Minuten)' : 'Dauer (Sekunden)'"
                        class="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                    />
                    <div class="flex bg-surface p-1 rounded-xl shrink-0">
                        <button
                            @click="switchDurationUnit('s')"
                            :class="[
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                durationUnit === 's' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text'
                            ]"
                        >Sek</button>
                        <button
                            @click="switchDurationUnit('min')"
                            :class="[
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                durationUnit === 'min' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text'
                            ]"
                        >Min</button>
                    </div>
                </div>

                <div class="flex gap-1.5 bg-surface p-1 rounded-xl">
                    <button @click="metric = 'none'" :class="[
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                        metric === 'none' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text'
                    ]">Kein Metric</button>
                    <button @click="metric = 'intensity'" :class="[
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                        metric === 'intensity' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text'
                    ]">Intensität</button>
                    <button @click="metric = 'speed'" :class="[
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                        metric === 'speed' ? 'bg-primary-500 text-white' : 'text-text-muted hover:text-text'
                    ]">Geschw. (km/h)</button>
                </div>

                <input v-if="metric !== 'none'" v-model.number="metricValue" type="number"
                    :placeholder="metric === 'intensity' ? 'Intensität' : 'Geschwindigkeit (km/h)'"
                    class="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors" />
            </div>

            <!-- Save -->
            <button @click="save" class="w-full bg-primary-500 hover:bg-primary-600 rounded-xl py-3 font-semibold text-sm transition-colors">
                {{ isEdit ? 'Speichern' : 'Hinzufügen' }}
            </button>
            </div>
        </Transition>
    </div>
</template>

