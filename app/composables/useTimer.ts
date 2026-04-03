export function useTimer() {
    const isRunning = ref(false)
    const remaining = ref(0)
    let interval: ReturnType<typeof setInterval> | null = null

    function clearTimer() {
        if (interval !== null) {
            clearInterval(interval)
            interval = null
        }
    }

    function startCountdown(seconds: number) {
        clearTimer()
        remaining.value = seconds
        isRunning.value = true
        interval = setInterval(() => {
            if (remaining.value <= 1) {
                remaining.value = 0
                isRunning.value = false
                clearTimer()
                return
            }
            remaining.value--
        }, 1000)
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
