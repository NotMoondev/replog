interface ActiveSessionMeta {
    workoutId: string
    workoutName: string
}

const ACTIVE_KEY = 'replog-active-session'
const DRAFT_PREFIX = 'replog-session-draft-'

const _meta = ref<ActiveSessionMeta | null>(null)
let _loaded = false

export function useActiveSession() {
    if (!_loaded && import.meta.client) {
        _loaded = true
        try {
            const raw = localStorage.getItem(ACTIVE_KEY)
            _meta.value = raw ? JSON.parse(raw) : null
        } catch {
            _meta.value = null
        }
    }

    function set(workoutId: string, workoutName: string) {
        // Clear old draft if switching to a different workout mid-session
        if (_meta.value && _meta.value.workoutId !== workoutId && import.meta.client) {
            localStorage.removeItem(`${DRAFT_PREFIX}${_meta.value.workoutId}`)
        }
        _meta.value = { workoutId, workoutName }
        if (import.meta.client) {
            localStorage.setItem(ACTIVE_KEY, JSON.stringify(_meta.value))
        }
    }

    /** Clears the active session marker and the associated draft. */
    function clear() {
        if (_meta.value && import.meta.client) {
            localStorage.removeItem(`${DRAFT_PREFIX}${_meta.value.workoutId}`)
        }
        _meta.value = null
        if (import.meta.client) {
            localStorage.removeItem(ACTIVE_KEY)
        }
    }

    const isActive = computed(() => _meta.value !== null)

    /**
     * Navigate to a session, showing a conflict dialog if a different session is already active.
     * Returns handlers + state that the caller can bind to a dialog in their template.
     */
    function useConflictGuard() {
        const router = useRouter()
        const showConflict = ref(false)
        let _pendingWorkoutId = ''
        let _pendingWorkoutName = ''

        function navigateTo(workoutId: string, workoutName: string) {
            const active = _meta.value
            if (!active || active.workoutId === workoutId) {
                router.push(`/session/${workoutId}`)
                return
            }
            _pendingWorkoutId = workoutId
            _pendingWorkoutName = workoutName
            showConflict.value = true
        }

        function confirmDiscard() {
            showConflict.value = false
            clear()
            router.push(`/session/${_pendingWorkoutId}`)
        }

        function confirmResume() {
            showConflict.value = false
            if (_meta.value) router.push(`/session/${_meta.value.workoutId}`)
        }

        function cancel() {
            showConflict.value = false
        }

        return { showConflict, navigateTo, confirmDiscard, confirmResume, cancel }
    }

    return { meta: readonly(_meta), isActive, set, clear, useConflictGuard }
}
