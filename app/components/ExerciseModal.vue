<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'

const props = defineProps<{
    workoutId: string
}>()

const emit = defineEmits(['close'])

const store = useWorkoutStore()

const type = ref<'strength' | 'cardio'>('strength')
const name = ref('')

/* Strength */
const sets = ref<Array<{ reps?: number; weight?: number }>>([
  { reps: undefined, weight: undefined }
])

/* Cardio */
const duration = ref<number | undefined>()
const metric = ref<'intensity' | 'speed' | 'none'>('none')
const metricValue = ref<number | undefined>()

async function save() {
    if (!name.value) return

    let exercise: any

    if (type.value === 'strength') {
        exercise = {
            id: crypto.randomUUID(),
            type: 'strength',
            name: name.value,
            sets: sets.value,
        }
    } else {
        exercise = {
            id: crypto.randomUUID(),
            type: 'cardio',
            name: name.value,
            duration: duration.value ?? 0,
            metric: metric.value,
            metricValue: metric.value !== 'none' ? metricValue.value : undefined,
        }
    }

    await store.addExercise(props.workoutId, exercise)

    emit('close')
}
</script>

<template>
    <div class="fixed inset-0 bg-black/50 flex items-end" @click.self="emit('close')">
        <div class="w-full bg-card rounded-t-3xl p-6 space-y-4">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl">Neue Übung</h2>
                <button @click="emit('close')">✕</button>
            </div>

            <!-- Type Switch -->
            <div class="flex gap-2">
                <button @click="type = 'strength'" :class="[
                    'flex-1 py-2 rounded',
                    type === 'strength'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-700'
                ]">
                    Kraft
                </button>

                <button @click="type = 'cardio'" :class="[
                    'flex-1 py-2 rounded',
                    type === 'cardio'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-700'
                ]">
                    Cardio
                </button>
            </div>

            <!-- Name -->
            <input v-model="name" placeholder="Name" class="w-full bg-neutral-600 rounded-lg p-3" />

            <hr class="h-1 border-none bg-linear-to-r from-neutral-800 via-neutral-700 to-neutral-800">

            <!-- Strength Form -->
            <div v-if="type === 'strength'" class="space-y-3 flex flex-col mb-6">
                <div class="flex flex-col overflow-y-auto max-h-96 space-y-2">
                    <div v-for="(set, i) in sets" :key="i" class="flex gap-2 items-center">

                        <span class="text-sm text-neutral-200 shrink-0 text-center bg-neutral-700 py-3.5 px-3 rounded-lg whitespace-nowrap">SET {{ i + 1 }}</span>

                        <input v-model.number="set.reps" type="number" placeholder="Reps"
                            class="bg-neutral-600 rounded-lg p-3 w-full" />

                        <input v-model.number="set.weight" type="number" placeholder="kg"
                            class="bg-neutral-600 rounded-lg p-3 w-full" />

                        <button @click="sets.splice(i, 1)" class="shrink-0 text-neutral-400 hover:text-red-400 p-2">
                            <IconTrash2 class="size-5" />
                        </button>
                    </div>
                </div>

                <button @click="sets.push({ reps: undefined, weight: undefined })"
                    class="w-full border border-dashed border-neutral-600 text-neutral-400 hover:text-primary-400 hover:border-primary-500 rounded-lg py-2 text-sm transition-colors">
                    + Set hinzufügen
                </button>
            </div>

            <!-- Cardio Form -->
            <div v-if="type === 'cardio'" class="space-y-3 flex flex-col mb-6 overflow-y-auto max-h-96">
                <input v-model.number="duration" type="number" placeholder="Dauer (Sekunden)"
                    class="w-full bg-neutral-600 rounded-lg p-3" />

                <div class="flex gap-2">
                    <button @click="metric = 'none'" :class="[
                        'flex-1 py-2 rounded text-sm',
                        metric === 'none' ? 'bg-primary-500 text-white' : 'bg-neutral-700'
                    ]">Kein Metric</button>
                    <button @click="metric = 'intensity'" :class="[
                        'flex-1 py-2 rounded text-sm',
                        metric === 'intensity' ? 'bg-primary-500 text-white' : 'bg-neutral-700'
                    ]">Intensität</button>
                    <button @click="metric = 'speed'" :class="[
                        'flex-1 py-2 rounded text-sm',
                        metric === 'speed' ? 'bg-primary-500 text-white' : 'bg-neutral-700'
                    ]">Geschw. (km/h)</button>
                </div>

                <input v-if="metric !== 'none'" v-model.number="metricValue" type="number"
                    :placeholder="metric === 'intensity' ? 'Intensität' : 'Geschwindigkeit (km/h)'"
                    class="w-full bg-neutral-600 rounded-lg p-3" />
            </div>

            <!-- Save -->
            <button @click="save" class="w-full bg-primary-500 rounded-xl py-3 font-medium">
                Speichern
            </button>
        </div>
    </div>
</template>
