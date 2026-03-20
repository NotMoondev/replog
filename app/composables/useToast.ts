interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'info'
}

const _toasts = ref<Toast[]>([])

export function useToast() {
    function addToast(message: string, type: Toast['type'] = 'success') {
        const id = crypto.randomUUID()
        _toasts.value.push({ id, message, type })
        setTimeout(() => removeToast(id), 3000)
    }

    function removeToast(id: string) {
        _toasts.value = _toasts.value.filter(t => t.id !== id)
    }

    return { toasts: readonly(_toasts), addToast, removeToast }
}
