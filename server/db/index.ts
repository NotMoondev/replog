import Dexie, { Table } from 'dexie'
import type { Workout } from '~~/types/workout'
import type { TrainingPlan } from '~~/types/trainingPlan'
import type { WorkoutSession } from '~~/types/session'

class AppDB extends Dexie {
    workouts!: Table<Workout, string>
    trainingPlans!: Table<TrainingPlan, string>
    sessions!: Table<WorkoutSession, string>

    constructor() {
        super('workoutDB')

        this.version(1).stores({
            workouts: 'id, name, createdAt',
            trainingPlans: 'id, date, workoutId',
            sessions: 'id, workoutId, date',
        })
    }
}

export const db = new AppDB()
