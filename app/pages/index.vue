<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'
import { db } from '~/utils/db'

const store = useWorkoutStore()
const planStore = useTrainingPlanStore()

const sessionCount = ref(0)

const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const today = computed(() => {
    return new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })
})

const todayWorkout = computed(() => {
    const wid = planStore.todayWorkoutId
    if (!wid) return null
    return store.workouts.find(w => w.id === wid) ?? null
})

const weekDays = computed(() => {
    if (!planStore.activePlan) return []
    return planStore.activePlan.days.map((day, i) => ({
        label: WEEKDAYS_SHORT[i],
        weekday: i,
        isRestDay: day.isRestDay,
        workout: day.workoutId ? store.workouts.find(w => w.id === day.workoutId) ?? null : null,
        isToday: i === planStore.todayWeekday,
    }))
})

onMounted(async () => {
    await Promise.all([store.loadWorkouts(), planStore.loadPlans()])
    sessionCount.value = await db.sessions.count()
})
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-5">
        <!-- Header -->
        <div class="flex justify-between items-center pt-1">
            <div>
                <h3 id="app-logo" class="font-black italic text-3xl">REPLOG</h3>
                <p class="text-text-muted text-sm capitalize">{{ today }}</p>
            </div>
            <NuxtLink to="/settings" class="p-2 text-text-muted hover:text-text transition-colors">
                <IconSettings class="size-5" />
            </NuxtLink>
        </div>

        <!-- Onboarding hint -->
        <div
            v-if="store.workouts.length === 0 && !planStore.activePlan"
            class="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 space-y-1"
        >
            <p class="text-sm font-semibold text-primary-400">👋 Willkommen bei REPLOG!</p>
            <p class="text-xs text-text-muted">
                Erstelle zuerst ein
                <NuxtLink to="/workouts" class="text-primary-400 underline underline-offset-2">Workout</NuxtLink>,
                dann einen
                <NuxtLink to="/plan" class="text-primary-400 underline underline-offset-2">Trainingsplan</NuxtLink>
                und starte durch.
            </p>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold">{{ store.workouts.length }}</div>
                <div class="text-xs text-text-muted mt-0.5">Workouts</div>
            </div>
            <div class="bg-card border border-border rounded-2xl p-3 text-center">
                <div class="text-2xl font-bold">{{ sessionCount }}</div>
                <div class="text-xs text-text-muted mt-0.5">Sessions</div>
            </div>
        </div>

        <!-- Today's Training Card -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Heutiges Training</p>

            <div v-if="!planStore.activePlan" class="text-sm text-text-muted">
                Kein Trainingsplan aktiv. —
                <NuxtLink to="/plan" class="text-primary-400 hover:text-primary-300 transition-colors">Plan erstellen</NuxtLink>
            </div>

            <div v-else-if="planStore.todayIsRestDay" class="flex items-center gap-2 text-text-muted">
                <IconBedDouble class="size-4" />
                <span class="text-sm">Ruhetag — erhole dich gut!</span>
            </div>

            <div v-else-if="todayWorkout" class="space-y-3">
                <div>
                    <div class="font-semibold">{{ todayWorkout.name }}</div>
                    <div class="text-xs text-text-muted">{{ todayWorkout.exercises.length }} Übungen</div>
                </div>
                <NuxtLink
                    :to="`/session/${todayWorkout.id}`"
                    class="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center rounded-xl py-2.5 font-semibold text-sm transition-colors"
                >
                    Training starten
                </NuxtLink>
            </div>

            <div v-else class="text-sm text-text-muted">
                Kein Workout für heute eingetragen. —
                <NuxtLink to="/plan" class="text-primary-400 hover:text-primary-300 transition-colors">Plan bearbeiten</NuxtLink>
            </div>
        </div>

        <!-- Weekly plan overview -->
        <div v-if="planStore.activePlan" class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Diese Woche</p>
            <div class="grid grid-cols-7 gap-1.5">
                <div
                    v-for="day in weekDays"
                    :key="day.weekday"
                    class="flex flex-col items-center gap-1"
                >
                    <span
                        class="text-[10px] font-medium"
                        :class="day.isToday ? 'text-primary-400' : 'text-text-muted'"
                    >
                        {{ day.label }}
                    </span>
                    <div
                        class="w-full aspect-square rounded-lg flex items-center justify-center transition-colors"
                        :class="[
                            day.isToday
                                ? 'bg-primary-500 ring-2 ring-primary-500/30'
                                : day.isRestDay
                                    ? 'bg-neutral-800'
                                    : 'bg-primary-500/20',
                        ]"
                        :title="day.isRestDay ? 'Ruhetag' : (day.workout?.name ?? 'Kein Workout')"
                    >
                        <IconBedDouble
                            v-if="day.isRestDay"
                            class="size-3"
                            :class="day.isToday ? 'text-white' : 'text-text-muted'"
                        />
                        <IconDumbbell
                            v-else
                            class="size-3"
                            :class="day.isToday ? 'text-white' : 'text-primary-400'"
                        />
                    </div>
                    <span
                        v-if="!day.isRestDay && day.workout"
                        class="text-[9px] text-center leading-tight w-full truncate text-text-muted"
                    >
                        {{ day.workout.name }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Recent Workouts -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Zuletzt trainiert</p>

            <div v-if="store.workouts.length === 0" class="text-sm text-text-muted">
                Noch keine Workouts erstellt.
            </div>

            <div v-else class="space-y-2">
                <NuxtLink
                    v-for="w in store.workouts.slice(0, 3)"
                    :key="w.id"
                    :to="`/workouts/${w.id}`"
                    class="flex justify-between items-center py-1 hover:opacity-80 transition-opacity"
                >
                    <span class="text-sm font-medium">{{ w.name }}</span>
                    <span class="text-xs text-text-muted">{{ w.exercises.length }} Übungen</span>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

