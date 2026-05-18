export function useTimer() {
    const isRunning = ref(false)
    const hasEnded = ref(false)
    const remaining = ref(0)
    const elapsed = ref(0)

    let interval: ReturnType<typeof setInterval> | null = null
    let didVibrateOnEnd = false

    // absolute time
    let endTime: number | null = null

    function clearTimer() {
        if (interval !== null) {
            clearInterval(interval)
            interval = null
        }
    }

    function notificationsEnabled(): boolean {
        return localStorage.getItem('timerNotificationEnabled') === 'true'
            && typeof Notification !== 'undefined'
            && Notification.permission === 'granted'
    }

    function postToSW(message: object) {
        if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) return
        navigator.serviceWorker.controller.postMessage(message)
    }

    function updateRemaining() {
        if (!endTime) return

        const now = Date.now()
        const diff = endTime - now

        if (diff > 0) {
            remaining.value = Math.ceil(diff / 1000)
            didVibrateOnEnd = false
        } else {
            remaining.value = 0
            if (isRunning.value) {
                isRunning.value = false
                hasEnded.value = true
                if (!didVibrateOnEnd) {
                    didVibrateOnEnd = true
                    navigator.vibrate?.([300, 100, 300])
                    // Fire notification directly from main thread (reliable for desktop/Firefox)
                    if (notificationsEnabled()) {
                        try {
                            new Notification('Pause vorbei!', {
                                body: 'Dein Pausentimer ist abgelaufen.',
                                icon: '/icons/icon-192.png',
                                tag: 'replog-timer',
                                renotify: true,
                            })
                        } catch {}
                        // Cancel SW timeout to avoid duplicate notification
                        postToSW({ type: 'TIMER_CANCEL' })
                    }
                }
            }
            elapsed.value = Math.floor(-diff / 1000)
        }
    }

    function startCountdown(seconds: number) {
        clearTimer()

        hasEnded.value = false
        elapsed.value = 0
        didVibrateOnEnd = false

        const now = Date.now()
        endTime = now + seconds * 1000

        isRunning.value = true

        updateRemaining()

        interval = setInterval(() => {
            updateRemaining()
        }, 250)

        if (notificationsEnabled()) {
            postToSW({ type: 'TIMER_START', endTime })
        }
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
        didVibrateOnEnd = false
        if (notificationsEnabled()) {
            postToSW({ type: 'TIMER_CANCEL' })
        }
    }

    /** Restore a running/elapsed timer from a previously saved absolute end timestamp. */
    function resumeFromEndTime(savedEndTime: number) {
        clearTimer()
        endTime = savedEndTime
        hasEnded.value = false
        elapsed.value = 0
        didVibrateOnEnd = false
        // Determine initial state without starting the interval yet
        updateRemaining()
        // Only keep the interval running if still counting down or already past (show elapsed)
        isRunning.value = endTime > Date.now()
        if (!isRunning.value) hasEnded.value = true
        interval = setInterval(() => {
            updateRemaining()
        }, 250)

        if (isRunning.value && notificationsEnabled()) {
            postToSW({ type: 'TIMER_START', endTime })
        }
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
