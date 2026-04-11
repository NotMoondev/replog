export function useTimer() {
    const isRunning = ref(false)
    const remaining = ref(0)

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
        const diff = Math.max(0, endTime - now)

        remaining.value = Math.ceil(diff / 1000)

        if (diff <= 0) {
            isRunning.value = false
            clearTimer()
        }
    }

    function startCountdown(seconds: number) {
        clearTimer()

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
        remaining.value = 0
        endTime = null
    }

    const formattedRemaining = computed(() => {
        const m = Math.floor(remaining.value / 60)
        const s = remaining.value % 60
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    })

    onUnmounted(() => {
        clearTimer()
    })

    return { isRunning, remaining, formattedRemaining, start, reset, stop }
}