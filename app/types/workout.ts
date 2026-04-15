export type Exercise =
    | StrengthExercise
    | CardioExercise

export type StrengthMode = 'reps+weight' | 'reps' | 'time'

export type MuscleGroup =
    | 'Brust'
    | 'Rücken'
    | 'Schultern'
    | 'Bizeps'
    | 'Trizeps'
    | 'Bauch'
    | 'Quadrizeps'
    | 'Beinbeuger'
    | 'Gesäß'
    | 'Waden'
    | 'Cardio'

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
    'Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps',
    'Bauch', 'Quadrizeps', 'Beinbeuger', 'Gesäß', 'Waden', 'Cardio',
]

export interface StrengthExercise {
    id: string
    /** ID of the preset this exercise was copied from, if any */
    presetId?: string
    type: 'strength'
    name: string
    mode?: StrengthMode // defaults to 'reps+weight' when absent
    sets: StrengthSet[]
    muscleGroups?: MuscleGroup[]
}

export interface StrengthSet {
    reps?: number
    weight?: number
    duration?: number // seconds, used when mode === 'time'
}

export interface CardioExercise {
    id: string
    /** ID of the preset this exercise was copied from, if any */
    presetId?: string
    type: 'cardio'
    name: string
    duration: number // in seconds
    metric: 'intensity' | 'speed' | 'none'
    metricValue?: number
    muscleGroups?: MuscleGroup[]
}

export interface Workout {
    id: string
    name: string
    exercises: Exercise[]
    createdAt: string // ISO string!
}
