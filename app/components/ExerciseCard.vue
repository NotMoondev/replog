<script setup lang="ts">
defineProps<{
    exercise: any
}>()
</script>

<template>
    <div class="bg-card border border-border rounded-2xl p-4 space-y-2">
        <div class="flex justify-between">
            <h3 class="font-medium">{{ exercise.name }}</h3>
            <span class="text-xs text-text-muted">
                {{ exercise.type }}
            </span>
        </div>

        <!-- Strength -->
        <div v-if="exercise.type === 'strength'" class="text-sm space-y-1">
            <div v-for="(set, i) in exercise.sets" :key="i">
                {{ set.reps }} reps
                <span v-if="set.weight"> @ {{ set.weight }}kg</span>
            </div>
        </div>

        <!-- Cardio -->
        <div v-if="exercise.type === 'cardio'" class="text-sm">
            {{ exercise.duration }}s
            <span v-if="exercise.intensity">
                • Intensität {{ exercise.intensity }}
            </span>
        </div>
    </div>
</template>
