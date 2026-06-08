export interface TrainingDay {
    weekday: number // 0=Mo, 1=Di, 2=Mi, 3=Do, 4=Fr, 5=Sa, 6=So
    workoutId?: string
    cardioExerciseId?: string
    dayMode?: 'workout' | 'cardio' // explicit mode when not a rest day
    isRestDay: boolean
}

export interface TrainingPlan {
    id: string
    name: string
    isActive: boolean
    days: TrainingDay[]
}
