import Dexie, { type Table } from 'dexie'
import type { Workout, Exercise } from '~/types/workout'
import type { TrainingPlan } from '~/types/trainingPlan'
import type { WorkoutSession } from '~/types/session'

class AppDB extends Dexie {
    workouts!: Table<Workout, string>
    trainingPlans!: Table<TrainingPlan, string>
    sessions!: Table<WorkoutSession, string>
    exercises!: Table<Exercise, string>

    constructor() {
        super('replogDB')

        this.version(1).stores({
            workouts: 'id, name, createdAt',
            trainingPlans: 'id, name',
            sessions: 'id, workoutId, date',
        })

        this.version(2).stores({
            trainingPlans: 'id, name, isActive',
        })

        this.version(3).stores({
            exercises: 'id, name, type',
        })
    }
}

export const db = new AppDB()
