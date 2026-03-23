type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'replog-theme'
const theme = ref<Theme>('dark')

function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
}

export function useTheme() {
    function setTheme(t: Theme) {
        theme.value = t
        localStorage.setItem(STORAGE_KEY, t)
        applyTheme(t)
    }

    function initTheme() {
        const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
        const initial: Theme = saved ?? 'dark'
        theme.value = initial
        applyTheme(initial)
    }

    return { theme: readonly(theme), setTheme, initTheme }
}
