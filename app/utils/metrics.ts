import type { WorkoutSessionExercise } from '~/types/session'

/** Weighted volume: sum of reps × weight across all strength sets. */
export function computeVolume(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (ex.sets) {
            for (const set of ex.sets) {
                total += (set.reps ?? 0) * (set.weight ?? 0)
            }
        }
    }
    return total
}

/** Total reps across bodyweight sets (no weight recorded). */
export function computeRepsVolume(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (!ex.sets || ex.sets.length === 0) continue
        if (ex.strengthMode === 'time') continue
        const isBodyweight =
            ex.strengthMode === 'reps' || ex.sets.every(s => (s.weight ?? 0) === 0)
        if (!isBodyweight) continue
        for (const set of ex.sets) {
            total += set.reps ?? 0
        }
    }
    return total
}

/** Score for cardio exercises: sum(duration_seconds × max(metricValue, 1)). */
export function computeCardioScore(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (ex.sets) continue // skip strength exercises
        if (ex.duration == null) continue
        total += ex.duration * Math.max(ex.metricValue ?? 1, 1)
    }
    return total
}

/** Total cardio duration in seconds. */
export function computeCardioDuration(exercises: WorkoutSessionExercise[]): number {
    let total = 0
    for (const ex of exercises) {
        if (ex.sets) continue
        total += ex.duration ?? 0
    }
    return total
}
