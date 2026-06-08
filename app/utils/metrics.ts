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

export interface ProgressiveOverloadResult {
    score: number              // 0–100, % der Übungen die sich verbessert haben
    improvedCount: number
    totalTrackedCount: number  // Übungen mit Verlauf
    newCount: number           // Übungen ohne bisherigen Verlauf
    avgDeltaPercent: number | null
}

export function computeProgressiveOverload(
    current: WorkoutSessionExercise[],
    prevExerciseMap: Map<string, WorkoutSessionExercise>,
): ProgressiveOverloadResult {
    const weighted = current.filter(ex => {
        if (!ex.sets?.length) return false
        if (ex.strengthMode === 'time' || ex.strengthMode === 'reps') return false
        return ex.sets.some(s => (s.weight ?? 0) > 0)
    })

    let improvedCount = 0
    let totalTrackedCount = 0
    let newCount = 0
    let deltaSum = 0

    const epleyE1RM = (sets: WorkoutSessionExercise['sets']): number =>
        Math.max(0, ...(sets ?? []).map(s => {
            const w = s.weight ?? 0
            const r = s.reps ?? 0
            return w > 0 && r > 0 ? w * (1 + r / 30) : w
        }))

    for (const ex of weighted) {
        const prev = prevExerciseMap.get(ex.exerciseId)
        if (!prev?.sets?.length) { newCount++; continue }
        totalTrackedCount++
        const curE1RM = epleyE1RM(ex.sets)
        const prevE1RM = epleyE1RM(prev.sets)
        if (prevE1RM > 0) {
            const delta = (curE1RM - prevE1RM) / prevE1RM * 100
            if (delta > 0) improvedCount++
            deltaSum += delta
        }
    }

    return {
        score: totalTrackedCount > 0 ? Math.round(improvedCount / totalTrackedCount * 100) : 0,
        improvedCount,
        totalTrackedCount,
        newCount,
        avgDeltaPercent: totalTrackedCount > 0 ? Math.round(deltaSum / totalTrackedCount) : null,
    }
}

export interface RelativeIntensityResult {
    avgPercent: number
    exerciseCount: number
}

/**
 * Durchschnittliche relative Intensität (% des gesch. 1RM via Epley) für gewichtete Übungen.
 * intensity/set = 1 / (1 + reps/30) — unabhängig vom absoluten Gewicht.
 */
export function computeRelativeIntensity(exercises: WorkoutSessionExercise[]): RelativeIntensityResult {
    const weighted = exercises.filter(ex => {
        if (!ex.sets?.length) return false
        if (ex.strengthMode === 'time' || ex.strengthMode === 'reps') return false
        return ex.sets.some(s => (s.weight ?? 0) > 0)
    })

    let intensitySum = 0
    let setCount = 0

    for (const ex of weighted) {
        for (const set of ex.sets ?? []) {
            const w = set.weight ?? 0
            const r = set.reps ?? 0
            if (w <= 0 || r <= 0) continue
            intensitySum += (1 / (1 + r / 30)) * 100
            setCount++
        }
    }

    return {
        avgPercent: setCount > 0 ? Math.round(intensitySum / setCount) : 0,
        exerciseCount: weighted.length,
    }
}

export interface SessionScoreResult {
    score: number              // 0–100
    comparedCount: number      // Übungen mit Verlauf
    baselineCount: number      // Übungen ohne Verlauf (effort-basiert geschätzt)
    avgDeltaPercent: number | null
}

export function computeSessionScore(
    current: WorkoutSessionExercise[],
    prevExerciseMap: Map<string, WorkoutSessionExercise>,
): SessionScoreResult {

    let progressionSum = 0
    let progressionWeight = 0
    let prCount = 0
    let comparedCount = 0

    for (const ex of current) {
        const prev = prevExerciseMap.get(ex.exerciseId)
        const weighted = ex.sets?.some(s => (s.weight ?? 0) > 0)

        if (weighted) {
            const cur = epley1RM(ex.sets)

            if (prev?.sets?.length) {
                const old = epley1RM(prev.sets)

                if (old > 0) {
                    const delta = ((cur - old) / old) * 100

                    progressionSum += normalizeDelta(delta) * 3
                    progressionWeight += 3
                    comparedCount++

                    if (delta > 5) prCount++
                }
            }
            continue
        }

        const bodyweight = ex.strengthMode === 'reps'

        if (bodyweight) {
            const curReps = ex.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0

            const prevReps = prev?.sets?.reduce((s, set) => s + (set.reps ?? 0), 0) ?? 0

            if (prevReps > 0) {
                const delta = ((curReps - prevReps) / prevReps) * 100

                progressionSum += normalizeDelta(delta)
                progressionWeight += 1
                comparedCount++
            }
            continue
        }

        if (ex.strengthMode === 'time') {
            const cur = ex.sets?.reduce((s, set) => s + (set.duration ?? 0), 0) ?? 0

            const old = prev?.sets?.reduce((s, set) => s + (set.duration ?? 0), 0) ?? 0

            if (old > 0) {
                const delta = ((cur - old) / old) * 100

                progressionSum += normalizeDelta(delta)
                progressionWeight += 1
                comparedCount++
            }
            continue
        }

        if (ex.duration) {
            const cur = ex.duration * Math.max(ex.metricValue ?? 1, 1)

            const old = (prev?.duration ?? 0) * Math.max(prev?.metricValue ?? 1, 1)

            if (old > 0) {
                const delta = ((cur - old) / old) * 100

                progressionSum += normalizeDelta(delta)
                progressionWeight += 1
                comparedCount++
            }
        }
    }

    const progressionScore = progressionWeight > 0 ? progressionSum / progressionWeight : 70

    const intensity = computeRelativeIntensity(current)

    const intensityScore = intensity.avgPercent

    const volume = computeVolume(current)

    const volumeScore = clamp(volume / 250, 0, 100)

    const prScore = clamp(prCount * 20, 0, 100)

    const score = Math.round(progressionScore * 0.5 + intensityScore * 0.2 + volumeScore * 0.2 + prScore * 0.1)

    return {
        score,
        comparedCount,
        baselineCount: 0,
        avgDeltaPercent: null,
    }
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v))
}

function normalizeDelta(delta: number): number {
    // 0% = 70 Punkte
    // +20% = 100
    // -20% = 40
    return clamp(70 + delta * 1.5, 0, 100)
}

function epley1RM(sets: WorkoutSessionExercise['sets']): number {
    return Math.max(
        0,
        ...(sets ?? []).map(s => {
            const w = s.weight ?? 0
            const r = s.reps ?? 0
            return w > 0 && r > 0
                ? w * (1 + r / 30)
                : 0
        }),
    )
}