<script setup lang="ts">
defineProps<{
    exercise: any
}>()
</script>

<template>
    <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <h3 class="font-medium">{{ exercise.name }}</h3>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="exercise.type === 'strength' ? 'bg-primary-500/20 text-primary-400' : 'bg-blue-500/20 text-blue-400'">
                {{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}
            </span>
        </div>

        <!-- Strength: set chips -->
        <div v-if="exercise.type === 'strength'" class="flex flex-wrap gap-2">
            <div v-for="(set, i) in exercise.sets" :key="i"
                class="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-3 py-1.5 text-sm">
                <span class="text-text-muted text-xs bg-neutral-600 rounded-lg px-2 py-1">{{ Number(i) + 1 }}</span>
                <span class="font-medium">{{ set.reps }}<span class="text-text-muted font-normal"> reps</span></span>
                <template v-if="set.weight">
                    <span class="text-neutral-500">•</span>
                    <span class="font-medium text-primary-400">{{ set.weight }}<span class="text-text-muted font-normal"> kg</span></span>
                </template>
            </div>
        </div>

        <!-- Cardio: stat pills -->
        <div v-if="exercise.type === 'cardio'" class="flex flex-wrap gap-2">
            <div class="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-3 py-1.5 text-sm">
                <IconTimer class="w-3.5 h-3.5 text-blue-400" />
                <span class="font-medium">{{ exercise.duration }}<span class="text-text-muted font-normal"> s</span></span>
            </div>
            <div v-if="exercise.metric && exercise.metric !== 'none' && exercise.metricValue != null"
                class="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-3 py-1.5 text-sm">
                <IconGauge v-if="exercise.metric === 'speed'" class="w-3.5 h-3.5 text-blue-400" />
                <IconFlame v-else class="w-3.5 h-3.5 text-blue-400" />
                <span class="font-medium">{{ exercise.metricValue }}<span class="text-text-muted font-normal"> {{ exercise.metric === 'speed' ? 'km/h' : '' }}</span></span>
                <span class="text-xs text-text-muted">{{ exercise.metric === 'intensity' ? 'Intensität' : 'Geschw.' }}</span>
            </div>
        </div>
    </div>
</template>
