export interface TrainingDay {
    date: string // ISO (yyyy-mm-dd)
    workoutId?: string
    isRestDay: boolean
}

export interface TrainingPlan {
    id: string
    name: string
    days: TrainingDay[]
}
