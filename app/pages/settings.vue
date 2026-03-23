<script setup lang="ts">
import { exportAllData, importAllData } from '~/utils/exportImport'

const { addToast } = useToast()
const { theme, setTheme } = useTheme()
const importing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const themeOptions = [
    { value: 'dark', label: 'Dunkel', icon: 'IconMoon' },
    { value: 'light', label: 'Hell', icon: 'IconSun' },
    { value: 'system', label: 'System', icon: 'IconMonitor' },
] as const

async function handleExport() {
    try {
        await exportAllData()
        addToast('Export erfolgreich!')
    } catch (e) {
        addToast(`Export fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`, 'error')
    }
}

function triggerImport() {
    fileInput.value?.click()
}

async function handleImport(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    ;(event.target as HTMLInputElement).value = ''

    const confirmed = confirm(
        'Achtung: Alle bestehenden Daten (Workouts, Pläne, Sessions) werden vollständig überschrieben! Fortfahren?'
    )
    if (!confirmed) return

    importing.value = true
    try {
        await importAllData(file)
        addToast('Import erfolgreich! Daten wurden wiederhergestellt.')
    } catch (e) {
        addToast(`Import fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`, 'error')
    } finally {
        importing.value = false
    }
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <h1 class="text-2xl font-semibold">Einstellungen</h1>

        <!-- Theme -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
                <h2 class="font-medium">Design</h2>
                <p class="text-sm text-text-muted mt-1">Wähle zwischen hellem, dunklem oder systemseitigem Design.</p>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <button
                    v-for="opt in themeOptions"
                    :key="opt.value"
                    @click="setTheme(opt.value)"
                    :class="[
                        'flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium transition-colors border',
                        theme === opt.value
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-surface/60 border-transparent text-text-muted hover:text-text'
                    ]"
                >
                    <IconMoon v-if="opt.icon === 'IconMoon'" class="size-4" />
                    <IconSun v-else-if="opt.icon === 'IconSun'" class="size-4" />
                    <IconMonitor v-else class="size-4" />
                    {{ opt.label }}
                </button>
            </div>
        </div>

        <!-- Data Backup -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div>
                <h2 class="font-medium">Datensicherung</h2>
                <p class="text-sm text-text-muted mt-1">
                    Exportiere alle deine Daten als JSON-Datei und importiere sie bei Bedarf wieder.
                </p>
            </div>

            <div class="space-y-3">
                <button
                    @click="handleExport"
                    class="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-text rounded-xl py-3 font-semibold text-sm transition-colors"
                >
                    <IconDownload class="size-5" />
                    Daten exportieren
                </button>

                <button
                    @click="triggerImport"
                    :disabled="importing"
                    class="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-text rounded-xl py-3 font-semibold text-sm transition-colors"
                >
                    <IconLoaderCircle v-if="importing" class="size-5 animate-spin" />
                    <IconUpload v-else class="size-5" />
                    Daten importieren
                </button>

                <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
            </div>

            <!-- Warning note -->
            <div class="flex items-start gap-2 pt-1">
                <IconAlertTriangle class="size-3.5 text-text-muted shrink-0 mt-0.5" />
                <p class="text-xs text-text-muted">Beim Importieren werden alle vorhandenen Daten unwiderruflich überschrieben. Mache vorher einen Export als Backup.</p>
            </div>
        </div>
    </div>
</template>

