import { db } from '~/utils/db'
import type { TrainingPlan } from '~/types/trainingPlan'
import type { Workout, Exercise } from '~/types/workout'

interface ExportData {
    version: number
    exportedAt: string
    workouts: unknown[]
    trainingPlans: unknown[]
    sessions: unknown[]
    exercises?: unknown[]
}

export async function exportAllData(): Promise<void> {
    const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        workouts: await db.workouts.toArray(),
        trainingPlans: await db.trainingPlans.toArray(),
        sessions: await db.sessions.toArray(),
        exercises: await db.exercises.toArray(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `replog-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export async function importAllData(file: File): Promise<void> {
    const text = await file.text()

    let data: ExportData
    try {
        data = JSON.parse(text)
    } catch {
        throw new Error('Ungültige JSON-Datei')
    }

    if (
        !Array.isArray(data.workouts) ||
        !Array.isArray(data.trainingPlans) ||
        !Array.isArray(data.sessions)
    ) {
        throw new Error('Ungültiges Export-Format')
    }

    await db.transaction('rw', [db.workouts, db.trainingPlans, db.sessions, db.exercises], async () => {
        await db.workouts.clear()
        await db.trainingPlans.clear()
        await db.sessions.clear()
        await db.exercises.clear()

        if (data.workouts.length) await db.workouts.bulkAdd(data.workouts as any[])
        if (data.trainingPlans.length) await db.trainingPlans.bulkAdd(data.trainingPlans as any[])
        if (data.sessions.length) await db.sessions.bulkAdd(data.sessions as any[])
        if (data.exercises?.length) await db.exercises.bulkAdd(data.exercises as any[])
    })
}

interface PlanExportData {
    version: number
    type: 'replog-plan'
    exportedAt: string
    plan: TrainingPlan
    workouts: Workout[]
}

export function exportPlan(plan: TrainingPlan, allWorkouts: Workout[]): void {
    const referencedIds = new Set(plan.days.map(d => d.workoutId).filter(Boolean))
    const workouts = allWorkouts.filter(w => referencedIds.has(w.id))
    const data: PlanExportData = {
        version: 1,
        type: 'replog-plan',
        exportedAt: new Date().toISOString(),
        plan,
        workouts,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = plan.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    a.download = `replog-plan-${safeName}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export interface ImportedPlan {
    plan: TrainingPlan
    workouts: Workout[]
}

export async function importPlan(file: File): Promise<ImportedPlan> {
    const text = await file.text()
    let data: PlanExportData
    try {
        data = JSON.parse(text)
    } catch {
        throw new Error('Ungültige JSON-Datei')
    }
    if (data.type !== 'replog-plan' || !data.plan || typeof data.plan !== 'object') {
        throw new Error('Ungültiges Plan-Format')
    }
    const { days, name } = data.plan
    if (typeof name !== 'string' || !Array.isArray(days)) {
        throw new Error('Ungültiges Plan-Format')
    }

    // Assign fresh IDs to workouts to avoid collisions with existing data
    const idMap = new Map<string, string>()
    const workouts: Workout[] = (data.workouts ?? []).map((w: Workout) => {
        const newId = crypto.randomUUID()
        idMap.set(w.id, newId)
        return {
            ...w,
            id: newId,
            exercises: (w.exercises ?? []).map((e: Exercise) => ({ ...e, id: crypto.randomUUID() })),
        }
    })

    const plan: TrainingPlan = {
        ...data.plan,
        id: crypto.randomUUID(),
        isActive: false,
        days: days.map(d => ({
            ...d,
            workoutId: d.workoutId ? (idMap.get(d.workoutId) ?? undefined) : undefined,
        })),
    }

    return { plan, workouts }
}
