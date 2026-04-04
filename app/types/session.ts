export interface WorkoutSessionExercise {
    exerciseId: string
    exerciseName?: string

    sets?: {
        reps: number
        weight?: number
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
