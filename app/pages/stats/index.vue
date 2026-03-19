<script setup lang="ts">
import { Line as LineChart } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import type { WorkoutSession } from '~/types/session'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useSessionStore } from '~/stores/useSessionStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)
ChartJS.defaults.color = '#a1a1aa'
ChartJS.defaults.borderColor = '#3f3f46'

const workoutStore = useWorkoutStore()
const sessionStore = useSessionStore()

const selectedWorkoutId = ref('')

const selectedWorkout = computed(() =>
    workoutStore.workouts.find(w => w.id === selectedWorkoutId.value) ?? null
)

onMounted(async () => {
    await workoutStore.loadWorkouts()
})

watch(selectedWorkoutId, async (wid) => {
    if (wid) await sessionStore.loadSessionsForWorkout(wid)
})

function getExerciseChartData(exerciseId: string) {
    const exercise = selectedWorkout.value?.exercises.find(e => e.id === exerciseId)
    if (!exercise) return null

    const sessionsWithEx = sessionStore.sessions.filter(s =>
        s.exercises.some(e => e.exerciseId === exerciseId)
    )
    if (!sessionsWithEx.length) return null

    const labels = sessionsWithEx.map(s =>
        new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    )

    const baseStyle = {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ef4444',
    }

    if (exercise.type === 'strength') {
        const hasWeight = sessionsWithEx.some(s => {
            const ex = s.exercises.find(e => e.exerciseId === exerciseId)
            return ex?.sets?.some(set => (set.weight ?? 0) > 0)
        })

        const datasets = []
        if (hasWeight) {
            datasets.push({
                ...baseStyle,
                label: 'Max Gewicht (kg)',
                data: sessionsWithEx.map(s => {
                    const ex = s.exercises.find(e => e.exerciseId === exerciseId)
                    if (!ex?.sets?.length) return null
                    const weights = ex.sets.map(set => set.weight ?? 0).filter(w => w > 0)
                    return weights.length ? Math.max(...weights) : null
                }),
            })
        }
        datasets.push({
            ...baseStyle,
            label: 'Gesamte Reps',
            borderColor: '#f87171',
            backgroundColor: 'rgba(248, 113, 113, 0.05)',
            fill: false,
            data: sessionsWithEx.map(s => {
                const ex = s.exercises.find(e => e.exerciseId === exerciseId)
                return ex?.sets?.reduce((sum, s) => sum + (s.reps ?? 0), 0) ?? null
            }),
        })
        return { labels, datasets }
    } else {
        const datasets = []
        if (exercise.metric !== 'none') {
            const metricLabel = exercise.metric === 'intensity' ? 'Intensität' : 'Geschwindigkeit (km/h)'
            datasets.push({
                ...baseStyle,
                label: metricLabel,
                data: sessionsWithEx.map(s =>
                    s.exercises.find(e => e.exerciseId === exerciseId)?.metricValue ?? null
                ),
            })
        }
        datasets.push({
            ...baseStyle,
            label: 'Dauer (Sekunden)',
            borderColor: '#f87171',
            backgroundColor: 'rgba(248, 113, 113, 0.05)',
            fill: !datasets.length,
            data: sessionsWithEx.map(s =>
                s.exercises.find(e => e.exerciseId === exerciseId)?.duration ?? null
            ),
        })
        return { labels, datasets }
    }
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#a1a1aa' },
        },
    },
    scales: {
        x: {
            ticks: { color: '#a1a1aa' },
            grid: { color: '#3f3f46' },
        },
        y: {
            ticks: { color: '#a1a1aa' },
            grid: { color: '#3f3f46' },
            beginAtZero: true,
        },
    },
}

const exerciseChartData = computed(() => {
    if (!selectedWorkout.value) return {} as Record<string, ReturnType<typeof getExerciseChartData>>
    const result: Record<string, ReturnType<typeof getExerciseChartData>> = {}
    for (const exercise of selectedWorkout.value.exercises) {
        result[exercise.id] = getExerciseChartData(exercise.id)
    }
    return result
})
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <h1 class="text-2xl font-semibold">Statistiken</h1>

        <!-- Accuracy warning -->
        <div class="bg-neutral-800 border border-yellow-700/40 rounded-2xl p-4 text-sm text-yellow-300/80 flex gap-2">
            <IconAlertTriangle class="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <span>Wenn Übungen nachträglich geändert wurden, können Statistiken unvollständig oder ungenau sein.</span>
        </div>

        <!-- Workout selector -->
        <div class="space-y-2">
            <label class="text-sm text-text-muted">Workout auswählen</label>
            <select
                v-model="selectedWorkoutId"
                class="w-full bg-neutral-700 rounded-xl p-3 text-sm outline-none"
            >
                <option value="">Workout wählen...</option>
                <option v-for="w in workoutStore.workouts" :key="w.id" :value="w.id">
                    {{ w.name }}
                </option>
            </select>
        </div>

        <!-- Loading -->
        <div v-if="sessionStore.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <!-- No sessions -->
        <div
            v-else-if="selectedWorkoutId && !sessionStore.loading && sessionStore.sessions.length === 0"
            class="text-center text-text-muted text-sm py-10"
        >
            Noch keine Sessions für dieses Workout aufgezeichnet.
        </div>

        <!-- Charts per exercise -->
        <div v-if="selectedWorkout && sessionStore.sessions.length > 0" class="space-y-6">
            <div
                v-for="exercise in selectedWorkout.exercises"
                :key="exercise.id"
                class="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
                <div>
                    <h3 class="font-medium">{{ exercise.name }}</h3>
                    <p class="text-xs text-text-muted">
                        {{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}
                        <span v-if="exercise.type === 'cardio' && exercise.metric !== 'none'">
                            · {{ exercise.metric === 'intensity' ? 'Intensität' : 'Geschwindigkeit' }}
                        </span>
                    </p>
                </div>

                <div v-if="exerciseChartData[exercise.id]" class="h-48">
                    <LineChart
                        :key="exercise.id"
                        :data="exerciseChartData[exercise.id]!"
                        :options="chartOptions"
                    />
                </div>
                <div v-else class="text-sm text-text-muted text-center py-4">
                    Keine Daten für diese Übung
                </div>
            </div>
        </div>
    </div>
</template>
