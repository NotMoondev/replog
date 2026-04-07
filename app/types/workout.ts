export type Exercise =
    | StrengthExercise
    | CardioExercise

export type StrengthMode = 'reps+weight' | 'reps' | 'time'

export interface StrengthExercise {
    id: string
    type: 'strength'
    name: string
    mode?: StrengthMode // defaults to 'reps+weight' when absent
    sets: StrengthSet[]
}

export interface StrengthSet {
    reps?: number
    weight?: number
    duration?: number // seconds, used when mode === 'time'
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
