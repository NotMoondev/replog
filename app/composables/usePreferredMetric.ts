export type MetricMode = 'session' | 'overload' | 'volume' | 'intensity'

export const METRIC_OPTIONS: { value: MetricMode; label: string }[] = [
    { value: 'session', label: 'Trainingsscore' },
    { value: 'overload', label: 'Progressive Overload' },
    { value: 'volume', label: 'Gesamtvolumen' },
    { value: 'intensity', label: 'Rel. Intensität' },
]

const STORAGE_KEY = 'preferredMetric'

export function usePreferredMetric() {
    const preferred = ref<MetricMode>(
        (typeof localStorage !== 'undefined'
            ? (localStorage.getItem(STORAGE_KEY) as MetricMode | null)
            : null) ?? 'session'
    )

    function setPreferred(metric: MetricMode) {
        preferred.value = metric
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, metric)
        }
    }

    return { preferred, setPreferred }
}
