import type { StrengthMode, MuscleGroup } from '~/types/workout'

export interface WorkoutSessionExercise {
    exerciseId: string
    exerciseName?: string
    strengthMode?: StrengthMode
    muscleGroups?: MuscleGroup[]

    sets?: {
        reps?: number
        weight?: number
        duration?: number // seconds, used for strength time-mode
    }[]

    duration?: number
    metricValue?: number
    note?: string
}

export interface WorkoutSession {
    id: string
    workoutId: string
    workoutName?: string
    date: string
    durationSeconds?: number
    exercises: WorkoutSessionExercise[]
    note?: string
}
