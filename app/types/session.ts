import type { StrengthMode } from '~/types/workout'

export interface WorkoutSessionExercise {
    exerciseId: string
    exerciseName?: string
    strengthMode?: StrengthMode

    sets?: {
        reps?: number
        weight?: number
        duration?: number // seconds, used for strength time-mode
    }[]

    duration?: number
    metricValue?: number
}

export interface WorkoutSession {
    id: string
    workoutId: string
    workoutName?: string
    date: string
    durationSeconds?: number
    exercises: WorkoutSessionExercise[]
}
