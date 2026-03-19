import Dexie, { type Table } from 'dexie'
import type { Workout } from '~/types/workout'
import type { TrainingPlan } from '~/types/trainingPlan'
import type { WorkoutSession } from '~/types/session'

class AppDB extends Dexie {
    workouts!: Table<Workout, string>
    trainingPlans!: Table<TrainingPlan, string>
    sessions!: Table<WorkoutSession, string>

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
    }
}

export const db = new AppDB()
