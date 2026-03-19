export type Exercise =
    | StrengthExercise
    | CardioExercise

export interface StrengthExercise {
    id: string
    type: 'strength'
    name: string
    sets: StrengthSet[]
}

export interface StrengthSet {
    reps: number
    weight?: number
}

export interface CardioExercise {
    id: string
    type: 'cardio'
    name: string
    duration: number // in seconds
    metric: 'intensity' | 'speed' | 'none'
    metricValue?: number
}

export interface Workout {
    id: string
    name: string
    exercises: Exercise[]
    createdAt: string // ISO string!
}
