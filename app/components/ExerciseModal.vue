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
const intensity = ref<number | undefined>()

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
            duration: duration.value,
            intensity: intensity.value,
        }
    }

    await store.addExercise(props.workoutId, exercise)

    emit('close')
}
</script>

<template>
    <div class="fixed inset-0 bg-black/50 flex items-end">
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
            <div v-if="type === 'strength'" class="space-y-2 flex flex-col mb-6">
                <div class="flex flex-col overflow-y-auto max-h-96 space-y-2">
                    <div v-for="(set, i) in sets" :key="i" class="flex gap-2 items-center w-fit">

                        <div class="flex items-center bg-neutral-700 p-3 gap-2 rounded">
                            <button class="border-r border-r-neutral-500 pr-2" @click="sets.splice(i, 1)">
                                <IconTrash2 class="size-5" />
                            </button>
                            <span class="whitespace-nowrap">Set {{ i + 1 }}</span>
                        </div>

                        <input v-model.number="set.reps" type="number" placeholder="Reps"
                        class="bg-neutral-600 rounded-lg p-3 w-full" />

                        <input v-model.number="set.weight" type="number" placeholder="kg"
                        class="bg-neutral-600 rounded-lg p-3 w-full" />
                    </div>
                </div>

                <button @click="sets.push({ reps: undefined, weight: undefined })" class="text-primary-400 self-end">
                    + Set
                </button>
            </div>

            <!-- Cardio Form -->
            <div v-if="type === 'cardio'" class="space-y-2 flex flex-col mb-6 overflow-y-auto max-h-96">
                <input v-model.number="duration" type="number" placeholder="Dauer (Sekunden)"
                    class="w-full bg-neutral-600 rounded-lg p-3" />

                <input v-model.number="intensity" type="number" placeholder="Intensität"
                    class="w-full bg-neutral-600 rounded-lg p-3" />
            </div>

            <!-- Save -->
            <button @click="save" class="w-full bg-primary-500 rounded-xl py-3 font-medium">
                Speichern
            </button>
        </div>
    </div>
</template>
