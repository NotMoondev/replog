import { db } from '~/utils/db'

interface ExportData {
    version: number
    exportedAt: string
    workouts: unknown[]
    trainingPlans: unknown[]
    sessions: unknown[]
}

export async function exportAllData(): Promise<void> {
    const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        workouts: await db.workouts.toArray(),
        trainingPlans: await db.trainingPlans.toArray(),
        sessions: await db.sessions.toArray(),
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

    await db.transaction('rw', [db.workouts, db.trainingPlans, db.sessions], async () => {
        await db.workouts.clear()
        await db.trainingPlans.clear()
        await db.sessions.clear()

        if (data.workouts.length) await db.workouts.bulkAdd(data.workouts as any[])
        if (data.trainingPlans.length) await db.trainingPlans.bulkAdd(data.trainingPlans as any[])
        if (data.sessions.length) await db.sessions.bulkAdd(data.sessions as any[])
    })
}
