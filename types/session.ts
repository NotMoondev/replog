export interface WorkoutSessionExercise {
    exerciseId: string

    sets?: {
        reps: number
        weight?: number
    }[]

    duration?: number
    intensity?: number
}

export interface WorkoutSession {
    id: string
    workoutId: string
    date: string
    exercises: WorkoutSessionExercise[]
}
