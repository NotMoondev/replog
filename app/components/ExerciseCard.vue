<script setup lang="ts">
defineProps<{
    exercise: any
}>()

const emit = defineEmits<{
    edit: []
    delete: []
}>()

const confirmingDelete = ref(false)

function formatDuration(secs: number): string {
    if (secs >= 60 && secs % 60 === 0) return `${secs / 60} min`
    if (secs >= 60) return `${(secs / 60).toFixed(1)} min`
    return `${secs} s`
}
</script>

<template>
    <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
        <!-- Header -->
        <div class="flex justify-between items-center gap-2">
            <h3 class="font-semibold text-sm truncate">{{ exercise.name }}</h3>
            <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    :class="exercise.type === 'strength' ? 'bg-primary-500/20 text-primary-400' : 'bg-blue-500/20 text-blue-400'">
                    {{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}
                </span>
                <button @click="emit('edit')" class="text-text-muted hover:text-primary-400 transition-colors">
                    <IconPencil class="size-4" />
                </button>
                <template v-if="confirmingDelete">
                    <button
                        @click="emit('delete'); confirmingDelete = false"
                        class="text-red-400 hover:text-red-300 text-xs font-medium transition px-1"
                    >
                        Löschen
                    </button>
                    <button @click="confirmingDelete = false" class="text-text-muted hover:text-text transition">
                        <IconX class="size-3.5" />
                    </button>
                </template>
                <button v-else @click="confirmingDelete = true" class="text-text-muted hover:text-red-400 transition-colors">
                    <IconTrash2 class="size-4" />
                </button>
            </div>
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
                <span class="font-medium">{{ formatDuration(exercise.duration) }}</span>
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

