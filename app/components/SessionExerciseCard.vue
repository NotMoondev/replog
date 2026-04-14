<script setup lang="ts">
import type { Exercise, StrengthExercise } from '~/types/workout'
import type { WorkoutSessionExercise } from '~/types/session'

interface LocalSet {
    reps?: number
    weight?: number
    duration?: number // seconds, for strength time-mode
    completed: boolean
}

interface LocalExercise {
    exerciseId: string
    completed: boolean
    sets: LocalSet[]
    duration?: number
    metricValue?: number
    skipped?: boolean
    note?: string
}

const props = defineProps<{
    exercise: Exercise
    lastExercise?: WorkoutSessionExercise | null
    modelValue: LocalExercise
}>()

const emit = defineEmits<{
    'update:modelValue': [LocalExercise]
}>()

function update(patch: Partial<LocalExercise>) {
    emit('update:modelValue', { ...props.modelValue, ...patch })
}

function updateSet(index: number, patch: Partial<LocalSet>) {
    const newSets = [...props.modelValue.sets]
    const existing = newSets[index]!
    newSets[index] = { ...existing, ...patch }
    update({ sets: newSets })
}

function toggleSetComplete(index: number) {
    const set = props.modelValue.sets[index]
    if (!set) return
    updateSet(index, { completed: !set.completed })
}

function lastSet(index: number) {
    return props.lastExercise?.sets?.[index]
}

const strengthMode = computed(() => {
    if (props.exercise.type !== 'strength') return null
    return (props.exercise as StrengthExercise).mode ?? 'reps+weight'
})

const metricLabel = computed(() => {
    if (props.exercise.type !== 'cardio') return ''
    if (props.exercise.metric === 'intensity') return 'Intensität'
    if (props.exercise.metric === 'speed') return 'km/h'
    return ''
})

const durationUnit = computed((): 's' | 'min' => {
    if (props.exercise.type !== 'cardio') return 's'
    const d = (props.exercise as any).duration ?? 0
    return d >= 60 && d % 60 === 0 ? 'min' : 's'
})

// For time-mode sets: auto-detect unit from first template set
const timeDurationUnit = computed((): 's' | 'min' => {
    if (props.exercise.type !== 'strength') return 's'
    const firstDur = (props.exercise as StrengthExercise).sets[0]?.duration ?? 0
    return firstDur >= 60 && firstDur % 60 === 0 ? 'min' : 's'
})

function getSetDurationDisplay(i: number): number | undefined {
    const v = props.modelValue.sets[i]?.duration
    if (v == null) return undefined
    return timeDurationUnit.value === 'min' ? Math.round(v / 60 * 100) / 100 : v
}

function setSetDuration(i: number, val: number | undefined) {
    const secs = val == null || isNaN(val as number)
        ? undefined
        : timeDurationUnit.value === 'min' ? Math.round((val as number) * 60) : (val as number)
    updateSet(i, { duration: secs })
}

const durationDisplay = computed({
    get(): number | undefined {
        const v = props.modelValue.duration
        if (v == null) return undefined
        return durationUnit.value === 'min' ? Math.round(v / 60 * 100) / 100 : v
    },
    set(val: number | undefined) {
        const secs = val == null || isNaN(val as number)
            ? undefined
            : durationUnit.value === 'min' ? Math.round((val as number) * 60) : (val as number)
        update({ duration: secs })
    },
})

const completedSetCount = computed(() => props.modelValue.sets.filter(s => s.completed).length)
const totalSetCount = computed(() => props.modelValue.sets.length)

// ── Swipe gesture ──────────────────────────────────────────────────────────
const dragX = ref(0)
const isDragging = ref(false)
let touchStartX = 0
let touchStartY = 0
let isHorizontalSwipe = false

const SWIPE_THRESHOLD = 72

function onTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0]!.clientX
    touchStartY = e.touches[0]!.clientY
    isDragging.value = true
    isHorizontalSwipe = false
    dragX.value = 0
}

function onTouchMove(e: TouchEvent) {
    if (!isDragging.value) return
    const dx = e.touches[0]!.clientX - touchStartX
    const dy = e.touches[0]!.clientY - touchStartY

    if (!isHorizontalSwipe) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
            isHorizontalSwipe = true
        } else if (Math.abs(dy) > 8) {
            isDragging.value = false
            return
        } else {
            return
        }
    }

    e.preventDefault()
    const skipped = !!props.modelValue.skipped
    if (!skipped && dx < 0) {
        dragX.value = Math.max(dx, -150)
    } else if (skipped && dx > 0) {
        dragX.value = Math.min(dx, 150)
    } else {
        dragX.value = 0
    }
}

function onTouchEnd() {
    isDragging.value = false
    const skipped = !!props.modelValue.skipped
    if (!skipped && dragX.value <= -SWIPE_THRESHOLD) {
        update({ skipped: true })
    } else if (skipped && dragX.value >= SWIPE_THRESHOLD) {
        update({ skipped: false })
    }
    dragX.value = 0
}

const cardStyle = computed(() => ({
    transform: `translateX(${dragX.value}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
}))

const swipeProgress = computed(() => Math.min(Math.abs(dragX.value) / SWIPE_THRESHOLD, 1))

// Note
const showNoteInput = ref(!!props.modelValue.note)
watch(() => props.modelValue.note, (val) => {
    if (val) showNoteInput.value = true
})
</script>

<template>
    <div
        class="relative overflow-hidden rounded-2xl"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend.passive="onTouchEnd"
    >
        <!-- Swipe bg: skip (drag left, shown when not skipped) -->
        <div
            class="absolute inset-0 flex items-center justify-end pr-5 bg-red-500/15 rounded-2xl"
            :style="{ opacity: !modelValue.skipped ? swipeProgress : 0 }"
        >
            <div class="flex flex-col items-center gap-0.5">
                <IconX class="size-5 text-red-400" />
                <span class="text-xs text-red-400 font-medium">Überspringen</span>
            </div>
        </div>
        <!-- Swipe bg: restore (drag right, shown when skipped) -->
        <div
            class="absolute inset-0 flex items-center justify-start pl-5 bg-green-500/15 rounded-2xl"
            :style="{ opacity: modelValue.skipped ? swipeProgress : 0 }"
        >
            <div class="flex flex-col items-center gap-0.5">
                <IconRotateCcw class="size-5 text-green-400" />
                <span class="text-xs text-green-400 font-medium">Wiederherstellen</span>
            </div>
        </div>

        <!-- Card body -->
        <div
            class="border rounded-2xl p-4 space-y-3 relative select-none"
            :class="[
                modelValue.skipped
                    ? 'bg-surface/40 border-border/40 opacity-55'
                    : (completedSetCount > 0 || modelValue.completed)
                        ? 'bg-card border-primary-500/40'
                        : 'bg-card border-border'
            ]"
            :style="cardStyle"
        >
            <!-- Header -->
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <h3
                            class="font-semibold text-base leading-tight"
                            :class="modelValue.skipped ? 'line-through text-text-muted' : ''"
                        >
                            {{ exercise.name }}
                        </h3>
                        <span
                            v-if="modelValue.skipped"
                            class="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-medium shrink-0"
                        >
                            Übersprungen
                        </span>
                    </div>
                    <span class="text-xs text-text-muted">
                        {{ exercise.type === 'strength' ? 'Kraft' : 'Cardio' }}
                    </span>
                </div>
                <!-- Set counter badge (strength only, when not skipped) -->
                <div v-if="exercise.type === 'strength' && !modelValue.skipped" class="shrink-0 text-right">
                    <div
                        class="text-xs font-bold tabular-nums"
                        :class="completedSetCount === totalSetCount && totalSetCount > 0 ? 'text-primary-400' : 'text-text-muted'"
                    >
                        {{ completedSetCount }}/{{ totalSetCount }}
                    </div>
                    <div class="text-xs text-text-muted">Sets</div>
                </div>
            </div>

            <!-- Skipped hint -->
            <p v-if="modelValue.skipped" class="text-xs text-text-muted text-center pb-1">
                ← Nach rechts wischen zum Wiederherstellen
            </p>

            <template v-else>
                <!-- ── Strength ── -->
                <div v-if="exercise.type === 'strength'" class="space-y-1.5">

                    <!-- Column headers -->
                    <template v-if="strengthMode === 'reps+weight'">
                        <div class="grid gap-2 px-1 mb-1" style="grid-template-columns: 1.75rem 1fr 1fr 2.25rem">
                            <span></span>
                            <span class="text-xs text-text-muted text-center">Reps</span>
                            <span class="text-xs text-text-muted text-center">kg</span>
                            <span></span>
                        </div>
                    </template>
                    <template v-else-if="strengthMode === 'reps'">
                        <div class="grid gap-2 px-1 mb-1" style="grid-template-columns: 1.75rem 1fr 2.25rem">
                            <span></span>
                            <span class="text-xs text-text-muted text-center">Reps</span>
                            <span></span>
                        </div>
                    </template>
                    <template v-else-if="strengthMode === 'time'">
                        <div class="grid gap-2 px-1 mb-1" style="grid-template-columns: 1.75rem 1fr 2.25rem">
                            <span></span>
                            <span class="text-xs text-text-muted text-center">Zeit ({{ timeDurationUnit === 'min' ? 'min' : 's' }})</span>
                            <span></span>
                        </div>
                    </template>

                    <div
                        v-for="(set, i) in modelValue.sets"
                        :key="i"
                        class="grid items-center gap-2 rounded-xl px-1 py-0.5 transition-all"
                        :class="set.completed ? 'opacity-45' : ''"
                        :style="strengthMode === 'reps+weight'
                            ? 'grid-template-columns: 1.75rem 1fr 1fr 2.25rem'
                            : 'grid-template-columns: 1.75rem 1fr 2.25rem'"
                    >
                        <!-- Set number -->
                        <span class="text-xs font-bold text-text-muted text-center tabular-nums">
                            {{ i + 1 }}
                        </span>

                        <!-- reps+weight: Reps + Weight -->
                        <template v-if="strengthMode === 'reps+weight'">
                            <input
                                type="number"
                                inputmode="numeric"
                                :value="set.reps"
                                :placeholder="lastSet(i)?.reps != null ? String(lastSet(i)!.reps) : '—'"
                                @input="updateSet(i, { reps: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                                :disabled="set.completed"
                                class="w-full bg-surface border border-border rounded-xl px-2 py-2.5 text-sm text-center outline-none focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <input
                                type="number"
                                inputmode="decimal"
                                :value="set.weight"
                                :placeholder="lastSet(i)?.weight != null ? String(lastSet(i)!.weight) : '—'"
                                @input="updateSet(i, { weight: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                                :disabled="set.completed"
                                class="w-full bg-surface border border-border rounded-xl px-2 py-2.5 text-sm text-center outline-none focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </template>

                        <!-- reps only -->
                        <template v-else-if="strengthMode === 'reps'">
                            <input
                                type="number"
                                inputmode="numeric"
                                :value="set.reps"
                                :placeholder="lastSet(i)?.reps != null ? String(lastSet(i)!.reps) : '—'"
                                @input="updateSet(i, { reps: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                                :disabled="set.completed"
                                class="w-full bg-surface border border-border rounded-xl px-2 py-2.5 text-sm text-center outline-none focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </template>

                        <!-- time per set -->
                        <template v-else-if="strengthMode === 'time'">
                            <div class="relative">
                                <input
                                    type="number"
                                    inputmode="decimal"
                                    :value="getSetDurationDisplay(i)"
                                    @input="setSetDuration(i, ($event.target as HTMLInputElement).valueAsNumber || undefined)"
                                    :placeholder="lastSet(i)?.duration != null
                                        ? String(timeDurationUnit === 'min' ? Math.round(lastSet(i)!.duration! / 60 * 100) / 100 : lastSet(i)!.duration)
                                        : '—'"
                                    :disabled="set.completed"
                                    class="w-full bg-surface border border-border rounded-xl px-2 py-2.5 pr-10 text-sm text-center outline-none focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                                    {{ timeDurationUnit === 'min' ? 'min' : 's' }}
                                </span>
                            </div>
                        </template>

                        <!-- Complete toggle -->
                        <button
                            @click="toggleSetComplete(i)"
                            class="size-9 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                            :class="set.completed
                                ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                : 'border-border text-text-muted hover:border-primary-400 hover:text-primary-400 active:scale-95'"
                        >
                            <IconCheck class="size-4" />
                        </button>
                    </div>

                </div>

                <!-- ── Cardio ── -->
                <div v-else class="space-y-3">
                    <button
                        @click="update({ completed: !modelValue.completed })"
                        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all active:scale-[0.98]"
                        :class="modelValue.completed
                            ? 'bg-primary-500/15 border-primary-500 text-primary-400'
                            : 'bg-surface border-border text-text-muted hover:border-primary-400 hover:text-primary-400'"
                    >
                        <IconCheck class="size-4" />
                        {{ modelValue.completed ? 'Erledigt' : 'Als erledigt markieren' }}
                    </button>

                    <div class="flex gap-2" :class="modelValue.completed ? 'opacity-50 pointer-events-none' : ''">
                        <div class="relative flex-1">
                            <input
                                type="number"
                                inputmode="decimal"
                                :value="durationDisplay"
                                @input="durationDisplay = ($event.target as HTMLInputElement).valueAsNumber || undefined"
                                :placeholder="durationUnit === 'min' ? 'Min' : 'Sek'"
                                class="w-full bg-surface border border-border rounded-xl px-2.5 py-2.5 pr-10 text-sm outline-none focus:border-primary-500 transition-colors"
                            />
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                                {{ durationUnit === 'min' ? 'min' : 's' }}
                            </span>
                        </div>
                        <div class="relative flex-1">
                            <input
                                v-if="exercise.metric !== 'none'"
                                type="number"
                                inputmode="decimal"
                                :value="modelValue.metricValue"
                                @input="update({ metricValue: ($event.target as HTMLInputElement).valueAsNumber || undefined })"
                                :placeholder="metricLabel"
                                class="w-full bg-surface border border-border rounded-xl px-2.5 py-2.5 pr-12 text-sm outline-none focus:border-primary-500 transition-colors"
                            />
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                                {{ exercise.metric === 'speed' ? 'km/h' : 'Stufe' }}
                            </span>
                        </div>
                    </div>
                </div>
            <!-- Note -->
            <div class="pt-0.5">
                <button
                    v-if="!showNoteInput"
                    @click="showNoteInput = true"
                    class="text-xs text-text-muted hover:text-primary-400 flex items-center gap-1.5 transition-colors py-0.5"
                >
                    <IconNotebookPen class="size-3.5" />
                    Notiz hinzufügen
                </button>
                <div v-else class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-text-muted font-medium flex items-center gap-1.5">
                            <IconNotebookPen class="size-3.5" />
                            Notiz
                        </span>
                        <button
                            v-if="!modelValue.note"
                            @click="showNoteInput = false"
                            class="text-text-muted hover:text-text transition-colors p-0.5"
                        >
                            <IconX class="size-3.5" />
                        </button>
                    </div>
                    <textarea
                        :value="modelValue.note ?? ''"
                        @input="update({ note: ($event.target as HTMLTextAreaElement).value || undefined })"
                        placeholder="z.B. Gewicht beim nächsten Mal erhöhen…"
                        rows="2"
                        class="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 transition-colors resize-none text-text placeholder:text-text-muted/50"
                    />
                </div>
            </div>
            </template>
        </div>
    </div>
</template>
