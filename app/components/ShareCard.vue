<script setup lang="ts">
interface ExerciseSummary {
    name: string
    summary: string
    isPR: boolean
}

const props = defineProps<{
    workoutName: string
    date: string
    duration?: string
    exercises: ExerciseSummary[]
    totalVolume?: number
    totalReps?: number
    muscleGroups: { group: string; percent: number }[]
}>()

const MUSCLE_GROUP_HEX: Record<string, string> = {
    'Brust':       '#f43f5e',
    'Rücken':      '#0ea5e9',
    'Schultern':   '#8b5cf6',
    'Bizeps':      '#f59e0b',
    'Trizeps':     '#f97316',
    'Bauch':       '#eab308',
    'Quadrizeps':  '#10b981',
    'Beinbeuger':  '#14b8a6',
    'Gesäß':       '#ec4899',
    'Waden':       '#84cc16',
    'Cardio':      '#3b82f6',
}

const topGroups = computed(() => props.muscleGroups.slice(0, 5))
const displayExercises = computed(() => props.exercises.slice(0, 8))
</script>

<template>
    <div
        style="
            width: 390px;
            background-color: #0a0a0a;
            color: #f5f5f5;
            font-family: system-ui, -apple-system, sans-serif;
            padding: 28px;
            border-radius: 20px;
            box-sizing: border-box;
        "
    >
        <!-- Top row: branding + date -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
            <img src="/icons/icon-192.png" alt="Replog Logo" style="width: 22px; height: 22px; border-radius: 8px;" />
            <span style="color: #ef4444; font-size: 15px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase;">
                REPLOG
            </span>
            <span style="color: #525252; margin-left: auto; font-size: 12px;">{{ date }}</span>
        </div>

        <!-- Workout title + duration -->
        <div style="margin-bottom: 20px;">
            <div style="font-size: 24px; font-weight: 800; line-height: 1.2; color: #f5f5f5; margin-bottom: 6px;">
                {{ workoutName }}
            </div>
            <div v-if="duration" style="display: flex; align-items: center; gap: 5px; color: #737373; font-size: 13px;">
                <span>⏱</span>
                <span>{{ duration }}</span>
            </div>
        </div>

        <!-- Divider -->
        <div style="border-top: 1px solid #262626; margin-bottom: 16px;" />

        <!-- Exercise list -->
        <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 9px;">
            <div
                v-for="ex in displayExercises"
                :key="ex.name"
                style="display: flex; align-items: center; justify-content: space-between;"
            >
                <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                    <span v-if="ex.isPR" style="font-size: 13px; flex-shrink: 0;">🏆</span>
                    <span
                        style="font-size: 13px; font-weight: 600; color: #e5e5e5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px;"
                    >{{ ex.name }}</span>
                </div>
                <span style="font-size: 12px; color: #737373; flex-shrink: 0; margin-left: 8px;">{{ ex.summary }}</span>
            </div>
        </div>

        <!-- Stats -->
        <div
            v-if="totalVolume || totalReps"
            style="border-top: 1px solid #262626; padding-top: 16px; margin-bottom: 16px; display: flex; gap: 28px;"
        >
            <div v-if="totalVolume">
                <div style="font-size: 22px; font-weight: 700; color: #f5f5f5;">
                    {{ totalVolume.toLocaleString('de-DE') }} kg
                </div>
                <div style="font-size: 11px; color: #737373; margin-top: 2px;">Gesamtvolumen</div>
            </div>
            <div v-if="totalReps">
                <div style="font-size: 22px; font-weight: 700; color: #f5f5f5;">
                    {{ totalReps.toLocaleString('de-DE') }}
                </div>
                <div style="font-size: 11px; color: #737373; margin-top: 2px;">Reps gesamt</div>
            </div>
        </div>

        <!-- Muscle groups -->
        <div v-if="topGroups.length" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px;">
            <span
                v-for="mg in topGroups"
                :key="mg.group"
                :style="{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 10px',
                    borderRadius: '99px',
                    color: MUSCLE_GROUP_HEX[mg.group] ?? '#ef4444',
                    backgroundColor: `${MUSCLE_GROUP_HEX[mg.group] ?? '#ef4444'}1a`,
                    border: `1px solid ${MUSCLE_GROUP_HEX[mg.group] ?? '#ef4444'}40`,
                }"
            >
                {{ mg.group }} {{ mg.percent }}%
            </span>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #1a1a1a; padding-top: 12px; display: flex; justify-content: flex-end;">
            <span style="font-size: 11px; color: #3d3d3d;">made with REPLOG &lt;3</span>
        </div>
    </div>
</template>
