/** Centralised formatting utilities shared across pages and components. */
export function useFormatters() {
    /** Full date: "15. Jan. 2025" */
    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    /** Relative date: "Heute" / "Gestern" / "vor 3 Tagen" / "15. Jan." */
    function formatSessionDate(iso: string): string {
        const date = new Date(iso)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return 'Heute'
        if (diffDays === 1) return 'Gestern'
        if (diffDays < 7) return `vor ${diffDays} Tagen`
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
    }

    /** Relative date with "Zuletzt:" prefix for workout cards. */
    function formatLastSession(iso: string): string {
        const date = new Date(iso)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return 'Zuletzt: Heute'
        if (diffDays === 1) return 'Zuletzt: Gestern'
        if (diffDays < 7) return `Zuletzt: vor ${diffDays} Tagen`
        return `Zuletzt: ${date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}`
    }

    /** Session/workout duration: "30 min" / "1 min 30s" / "45s" */
    function formatDuration(seconds?: number): string | null {
        if (!seconds) return null
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        if (m === 0) return `${s}s`
        return s > 0 ? `${m} min ${s}s` : `${m} min`
    }

    /** Set duration (time-mode): "1 min" / "1.5 min" / "45 s" */
    function formatSetDuration(secs: number): string {
        if (secs >= 60 && secs % 60 === 0) return `${secs / 60} min`
        if (secs >= 60) return `${(secs / 60).toFixed(1)} min`
        return `${secs} s`
    }

    /** Cardio exercise duration (full, with hours): "1 h 30 min" / "30 min 15 s" / "45 s" */
    function formatExerciseDuration(seconds: number): string {
        if (seconds <= 0) return '0 s'
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
        if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`
        return `${s} s`
    }

    /** Volume display: "1.000 kg" / "1,5 t" */
    function formatVolume(kg: number): string {
        if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')} t`
        return `${kg.toLocaleString('de-DE')} kg`
    }

    /** Cardio metric display: "10 km/h" / "Stufe 4" / "" */
    function formatMetric(metric: string, value: number | undefined): string {
        if (metric === 'speed' && value != null) return `${value} km/h`
        if (metric === 'intensity' && value != null) return `Stufe ${value}`
        return ''
    }

    return {
        formatDate,
        formatSessionDate,
        formatLastSession,
        formatDuration,
        formatSetDuration,
        formatExerciseDuration,
        formatVolume,
        formatMetric,
    }
}
