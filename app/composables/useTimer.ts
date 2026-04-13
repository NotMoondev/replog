export function useTimer() {
    const isRunning = ref(false)
    const hasEnded = ref(false)
    const remaining = ref(0)
    const elapsed = ref(0)

    let interval: ReturnType<typeof setInterval> | null = null

    // absolute time
    let endTime: number | null = null

    function clearTimer() {
        if (interval !== null) {
            clearInterval(interval)
            interval = null
        }
    }

    function updateRemaining() {
        if (!endTime) return

        const now = Date.now()
        const diff = endTime - now

        if (diff > 0) {
            remaining.value = Math.ceil(diff / 1000)
        } else {
            remaining.value = 0
            if (isRunning.value) {
                isRunning.value = false
                hasEnded.value = true
            }
            elapsed.value = Math.floor(-diff / 1000)
        }
    }

    function startCountdown(seconds: number) {
        clearTimer()

        hasEnded.value = false
        elapsed.value = 0

        const now = Date.now()
        endTime = now + seconds * 1000

        isRunning.value = true

        updateRemaining()

        interval = setInterval(() => {
            updateRemaining()
        }, 250)
    }

    function start() {
        const enabled = localStorage.getItem('timerEnabled')
        if (enabled === 'false') return

        const duration = parseInt(localStorage.getItem('timerDuration') ?? '90', 10)
        startCountdown(duration)
    }

    function reset() {
        const duration = parseInt(localStorage.getItem('timerDuration') ?? '90', 10)
        startCountdown(duration)
    }

    function stop() {
        clearTimer()
        isRunning.value = false
        hasEnded.value = false
        remaining.value = 0
        elapsed.value = 0
        endTime = null
    }

    /** Restore a running/elapsed timer from a previously saved absolute end timestamp. */
    function resumeFromEndTime(savedEndTime: number) {
        clearTimer()
        endTime = savedEndTime
        hasEnded.value = false
        elapsed.value = 0
        // Determine initial state without starting the interval yet
        updateRemaining()
        // Only keep the interval running if still counting down or already past (show elapsed)
        isRunning.value = endTime > Date.now()
        if (!isRunning.value) hasEnded.value = true
        interval = setInterval(() => {
            updateRemaining()
        }, 250)
    }

    function getEndTime(): number | null {
        return endTime
    }

    const formattedRemaining = computed(() => {
        const m = Math.floor(remaining.value / 60)
        const s = remaining.value % 60
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    })

    const formattedElapsed = computed(() => {
        const m = Math.floor(elapsed.value / 60)
        const s = elapsed.value % 60
        return `+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    })

    onUnmounted(() => {
        clearTimer()
    })

    return { isRunning, hasEnded, remaining, elapsed, formattedRemaining, formattedElapsed, start, reset, stop, resumeFromEndTime, getEndTime }
}
