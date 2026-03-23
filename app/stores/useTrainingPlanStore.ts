import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { db } from '~/utils/db'
import { exportPlan, importPlan as importPlanFile } from '~/utils/exportImport'
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import type { TrainingPlan, TrainingDay } from '~/types/trainingPlan'

export const useTrainingPlanStore = defineStore('trainingPlans', {
    state: () => ({
        plans: [] as TrainingPlan[],
        loading: false,
    }),

    getters: {
        activePlan: (state): TrainingPlan | null =>
            state.plans.find(p => p.isActive) ?? null,

        todayWeekday: (): number => {
            // JS getDay(): 0=Sun, 1=Mon … 6=Sat → convert to 0=Mon … 6=Sun
            return (new Date().getDay() + 6) % 7
        },

        todayWorkoutId(): string | null {
            const plan = this.activePlan
            if (!plan) return null
            const day = plan.days.find(d => d.weekday === this.todayWeekday)
            if (!day || day.isRestDay) return null
            return day.workoutId ?? null
        },

        todayIsRestDay(): boolean {
            const plan = this.activePlan
            if (!plan) return false
            const day = plan.days.find(d => d.weekday === this.todayWeekday)
            return day?.isRestDay ?? false
        },
    },

    actions: {
        async loadPlans() {
            this.loading = true
            this.plans = await db.trainingPlans.toArray()
            this.loading = false
        },

        async createPlan(name: string): Promise<TrainingPlan> {
            const plan: TrainingPlan = {
                id: crypto.randomUUID(),
                name,
                isActive: this.plans.length === 0,
                days: Array.from({ length: 7 }, (_, weekday) => ({
                    weekday,
                    isRestDay: true,
                })),
            }
            await db.trainingPlans.add(plan)
            this.plans.push(plan)
            useToast().addToast(`"${name}" erstellt`)
            return plan
        },

        async deletePlan(id: string) {
            const plan = this.plans.find(p => p.id === id)
            await db.trainingPlans.delete(id)
            this.plans = this.plans.filter(p => p.id !== id)
            if (plan) useToast().addToast(`"${plan.name}" gelöscht`, 'info')
        },

        async setActivePlan(id: string) {
            for (const plan of this.plans) {
                plan.isActive = plan.id === id
                await db.trainingPlans.put(JSON.parse(JSON.stringify(toRaw(plan))))
            }
            const activated = this.plans.find(p => p.id === id)
            if (activated) useToast().addToast(`"${activated.name}" aktiviert`)
        },

        async updateDay(planId: string, weekday: number, data: Partial<TrainingDay>) {
            const plan = this.plans.find(p => p.id === planId)
            if (!plan) return
            const day = plan.days.find(d => d.weekday === weekday)
            if (day) {
                Object.assign(day, data)
            }
            await db.trainingPlans.put(JSON.parse(JSON.stringify(toRaw(plan))))
        },

        async renamePlan(id: string, name: string) {
            const plan = this.plans.find(p => p.id === id)
            if (!plan) return
            plan.name = name
            await db.trainingPlans.put(JSON.parse(JSON.stringify(toRaw(plan))))
            useToast().addToast('Plan umbenannt')
        },

        exportPlan(id: string) {
            const plan = this.plans.find(p => p.id === id)
            if (!plan) return
            const workoutStore = useWorkoutStore()
            exportPlan(
                JSON.parse(JSON.stringify(toRaw(plan))),
                JSON.parse(JSON.stringify(toRaw(workoutStore.workouts))),
            )
        },

        async importPlan(file: File): Promise<void> {
            const { plan, workouts } = await importPlanFile(file)
            const workoutStore = useWorkoutStore()
            await db.transaction('rw', [db.trainingPlans, db.workouts], async () => {
                await db.trainingPlans.add(plan)
                if (workouts.length) await db.workouts.bulkAdd(workouts)
            })
            this.plans.push(plan)
            workoutStore.workouts.push(...workouts)
            useToast().addToast(`"${plan.name}" importiert`)
        },
    },
})
