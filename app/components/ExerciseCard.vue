<script setup lang="ts">
import { onLongPress } from '@vueuse/core'

defineProps<{
    exercise: any
    focused?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
}>()

const emit = defineEmits<{
    edit: []
    delete: []
    'focus-request': []
    'move-up': []
    'move-down': []
}>()

const confirmingDelete = ref(false)
const cardRef = ref<HTMLElement | null>(null)

const { formatSetDuration, formatExerciseDuration } = useFormatters()

onLongPress(cardRef, () => {
    navigator.vibrate?.(50)
    emit('focus-request')
}, { delay: 500 })
</script>

<template>
    <div
        ref="cardRef"
        :class="['bg-card border rounded-2xl p-4 space-y-3 transition-colors select-none', focused ? 'border-primary-500' : 'border-border']"
    >
        <!-- Header -->
        <div class="flex justify-between items-center gap-2">
            <h3 class="font-semibold text-sm truncate">{{ exercise.name }}</h3>
            <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    :class="exercise.type === 'strength' ? 'bg-primary-500/20 text-primary-400' : 'bg-blue-500/20 text-blue-400'">
                    {{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}
                </span>

                <!-- Move buttons when focused -->
                <template v-if="focused">
                    <button
                        @click.stop="emit('move-up')"
                        :disabled="!canMoveUp"
                        :class="['rounded-lg p-1 transition-colors', canMoveUp ? 'text-primary-400 hover:bg-surface active:bg-surface-hover' : 'text-text-muted/30 cursor-not-allowed']"
                    >
                        <IconArrowUp class="size-4" />
                    </button>
                    <button
                        @click.stop="emit('move-down')"
                        :disabled="!canMoveDown"
                        :class="['rounded-lg p-1 transition-colors', canMoveDown ? 'text-primary-400 hover:bg-surface active:bg-surface-hover' : 'text-text-muted/30 cursor-not-allowed']"
                    >
                        <IconArrowDown class="size-4" />
                    </button>
                </template>

                <!-- Normal edit / delete buttons -->
                <template v-else>
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
                </template>
            </div>
        </div>

        <!-- Strength: set chips -->
        <div v-if="exercise.type === 'strength'" class="flex flex-wrap gap-2">
            <div v-for="(set, i) in exercise.sets" :key="i"
                class="flex items-center gap-1.5 bg-surface rounded-lg px-3 py-1.5 text-sm">
                <span class="text-text-muted text-xs bg-surface-hover rounded-lg px-2 py-1">{{ Number(i) + 1 }}</span>
                <!-- time mode -->
                <template v-if="exercise.mode === 'time'">
                    <span class="font-medium">{{ set.duration != null ? formatSetDuration(set.duration) : '—' }}</span>
                </template>
                <!-- reps or reps+weight -->
                <template v-else>
                    <span class="font-medium">{{ set.reps ?? '—' }}<span class="text-text-muted font-normal"> reps</span></span>
                    <template v-if="exercise.mode !== 'reps' && set.weight">
                        <span class="text-text-muted">•</span>
                        <span class="font-medium text-primary-400">{{ set.weight }}<span class="text-text-muted font-normal"> kg</span></span>
                    </template>
                </template>
            </div>
        </div>

        <!-- Cardio: stat pills -->
        <div v-if="exercise.type === 'cardio'" class="flex flex-wrap gap-2">
            <div class="flex items-center gap-1.5 bg-surface rounded-lg px-3 py-1.5 text-sm">
                <IconTimer class="w-3.5 h-3.5 text-blue-400" />
                <span class="font-medium">{{ formatExerciseDuration(exercise.duration) }}</span>
            </div>
            <div v-if="exercise.metric && exercise.metric !== 'none' && exercise.metricValue != null"
                class="flex items-center gap-1.5 bg-surface rounded-lg px-3 py-1.5 text-sm">
                <IconGauge v-if="exercise.metric === 'speed'" class="w-3.5 h-3.5 text-blue-400" />
                <IconFlame v-else class="w-3.5 h-3.5 text-blue-400" />
                <span class="font-medium">{{ exercise.metricValue }}<span class="text-text-muted font-normal"> {{ exercise.metric === 'speed' ? 'km/h' : '' }}</span></span>
                <span class="text-xs text-text-muted">{{ exercise.metric === 'intensity' ? 'Stufe' : 'Geschw.' }}</span>
            </div>
        </div>

        <!-- Muscle group tags -->
        <div v-if="exercise.muscleGroups?.length" class="flex flex-wrap gap-1">
            <span
                v-for="mg in exercise.muscleGroups"
                :key="mg"
                class="text-xs px-2 py-0.5 rounded-full bg-surface text-text-muted border border-border/60"
            >{{ mg }}</span>
        </div>
    </div>
</template>

