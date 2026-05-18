const SWIPE_THRESHOLD = 72

/**
 * Horizontal swipe gesture for toggling a "skipped" state.
 * Swipe left to skip, swipe right to restore.
 */
export function useSwipeGesture(
    isSkipped: () => boolean,
    onSkip: () => void,
    onRestore: () => void,
) {
    const dragX = ref(0)
    const isDragging = ref(false)
    let touchStartX = 0
    let touchStartY = 0
    let isHorizontalSwipe = false

    function onTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0]!.clientX
        touchStartY = e.touches[0]!.clientY
        isDragging.value = true
        isHorizontalSwipe = false
        dragX.value = 0
    }

    function onTouchMove(e: TouchEvent) {
        if (!isDragging.value) return
        const dx = e.touches[0]!.clientX - touchStartX
        const dy = e.touches[0]!.clientY - touchStartY

        if (!isHorizontalSwipe) {
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
                isHorizontalSwipe = true
            } else if (Math.abs(dy) > 8) {
                isDragging.value = false
                return
            } else {
                return
            }
        }

        e.preventDefault()
        const skipped = isSkipped()
        if (!skipped && dx < 0) {
            dragX.value = Math.max(dx, -150)
        } else if (skipped && dx > 0) {
            dragX.value = Math.min(dx, 150)
        } else {
            dragX.value = 0
        }
    }

    function onTouchEnd() {
        isDragging.value = false
        const skipped = isSkipped()
        if (!skipped && dragX.value <= -SWIPE_THRESHOLD) {
            onSkip()
        } else if (skipped && dragX.value >= SWIPE_THRESHOLD) {
            onRestore()
        }
        dragX.value = 0
    }

    const cardStyle = computed(() => ({
        transform: `translateX(${dragX.value}px)`,
        transition: isDragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }))

    const swipeProgress = computed(() => Math.min(Math.abs(dragX.value) / SWIPE_THRESHOLD, 1))

    return { onTouchStart, onTouchMove, onTouchEnd, cardStyle, swipeProgress }
}
