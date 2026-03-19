<script setup lang="ts">
import type { WorkoutSessionExercise } from '~/types/session'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useSessionStore } from '~/stores/useSessionStore'

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

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()
const sessionStore = useSessionStore()

const workoutId = computed(() => route.params.workoutId as string)
const workout = computed(() => workoutStore.workouts.find(w => w.id === workoutId.value))

const localData = ref<LocalExercise[]>([])
const lastSession = ref<Awaited<ReturnType<typeof sessionStore.getLastSessionForWorkout>>>(null)
const saving = ref(false)

onMounted(async () => {
    await workoutStore.loadWorkouts()
    lastSession.value = await sessionStore.getLastSessionForWorkout(workoutId.value)
    initLocalData()
})

watch(workout, () => {
    if (workout.value && localData.value.length === 0) initLocalData()
})

function initLocalData() {
    if (!workout.value) return
    localData.value = workout.value.exercises.map(ex => {
        if (ex.type === 'strength') {
            return {
                exerciseId: ex.id,
                completed: false,
                sets: ex.sets.map(() => ({ reps: undefined, weight: undefined, completed: false })),
                duration: undefined,
                metricValue: undefined,
            }
        } else {
            return {
                exerciseId: ex.id,
                completed: false,
                sets: [],
                duration: undefined,
                metricValue: undefined,
            }
        }
    })
}

function getLastExercise(exerciseId: string) {
    return lastSession.value?.exercises.find(e => e.exerciseId === exerciseId) ?? null
}

const doneCount = computed(() => {
    return localData.value.filter(d => {
        const ex = workout.value?.exercises.find(e => e.id === d.exerciseId)
        if (ex?.type === 'strength') return d.sets.some(s => s.completed)
        return d.completed
    }).length
})

const exerciseItems = computed(() =>
    (workout.value?.exercises ?? []).map((ex, i) => ({
        exercise: ex,
        localItem: localData.value[i] as LocalExercise,
        last: getLastExercise(ex.id),
        index: i,
    })).filter(item => item.localItem !== undefined)
)

async function finish() {
    saving.value = true
    const exercises: WorkoutSessionExercise[] = localData.value
        .filter(d => {
            const ex = workout.value?.exercises.find(e => e.id === d.exerciseId)
            if (ex?.type === 'strength') return d.sets.some(s => s.completed)
            return d.completed
        })
        .map(d => {
            const ex = workout.value?.exercises.find(e => e.id === d.exerciseId)
            if (ex?.type === 'strength') {
                return {
                    exerciseId: d.exerciseId,
                    sets: d.sets
                        .filter(s => s.completed)
                        .map(s => ({ reps: s.reps ?? 0, weight: s.weight })),
                }
            } else {
                return {
                    exerciseId: d.exerciseId,
                    duration: d.duration,
                    metricValue: d.metricValue,
                }
            }
        })
    await sessionStore.completeSession(workoutId.value, exercises)
    saving.value = false
    router.back()
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-4">
        <div v-if="!workout || localData.length === 0" class="flex justify-center py-20">
            <IconLoaderCircle class="size-12 animate-spin text-primary-500" />
        </div>

        <template v-else>
            <div>
                <h1 class="text-2xl font-semibold">{{ workout.name }}</h1>
                <p class="text-sm text-text-muted">
                    {{ doneCount }} / {{ workout.exercises.length }} erledigt
                    <span v-if="lastSession" class="ml-2 text-neutral-500">
                        · Letztes Training: {{ new Date(lastSession.date).toLocaleDateString('de-DE') }}
                    </span>
                </p>
            </div>

            <div class="space-y-3">
                <SessionExerciseCard
                    v-for="item in exerciseItems"
                    :key="item.exercise.id"
                    :exercise="item.exercise"
                    :lastExercise="item.last"
                    :modelValue="item.localItem"
                    @update:modelValue="localData[item.index] = $event"
                />
            </div>

            <button
                @click="finish"
                :disabled="saving || doneCount === 0"
                class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-2xl py-3 font-medium transition flex items-center justify-center gap-2"
            >
                <IconLoaderCircle v-if="saving" class="size-4 animate-spin" />
                Session abschließen
            </button>
        </template>
    </div>
</template>
