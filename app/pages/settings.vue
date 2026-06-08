<script setup lang="ts">
import { exportAllData, importAllData } from '~/utils/exportImport'
import { usePreferredMetric, METRIC_OPTIONS } from '~/composables/usePreferredMetric'

const { addToast } = useToast()
const { theme, setTheme } = useTheme()
const { preferred, setPreferred } = usePreferredMetric()
const importing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const { public: { appVersion } } = useRuntimeConfig()

// Timer settings
const timerEnabled = ref(localStorage.getItem('timerEnabled') !== 'false')
const timerDuration = ref(parseInt(localStorage.getItem('timerDuration') ?? '90', 10))
const timerAutoClose = ref(localStorage.getItem('timerAutoClose') === 'true')
const timerNotificationEnabled = ref(localStorage.getItem('timerNotificationEnabled') === 'true')
const notificationPermission = ref<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
)

watch(timerEnabled, (val) => localStorage.setItem('timerEnabled', String(val)))
watch(timerDuration, (val) => {
    const parsed = Math.max(1, Math.round(val))
    localStorage.setItem('timerDuration', String(parsed))
})
watch(timerAutoClose, (val) => localStorage.setItem('timerAutoClose', String(val)))

async function toggleTimerNotification() {
    if (timerNotificationEnabled.value) {
        timerNotificationEnabled.value = false
        localStorage.setItem('timerNotificationEnabled', 'false')
        return
    }
    if (typeof Notification === 'undefined') {
        addToast('Benachrichtigungen werden in diesem Browser nicht unterstützt.', 'error')
        return
    }
    if (Notification.permission === 'denied') {
        addToast('Benachrichtigungen sind im Browser blockiert. Bitte in den Browser-Einstellungen erlauben.', 'error')
        return
    }
    const permission = await Notification.requestPermission()
    notificationPermission.value = permission
    if (permission === 'granted') {
        timerNotificationEnabled.value = true
        localStorage.setItem('timerNotificationEnabled', 'true')
        addToast('Timer-Benachrichtigungen aktiviert')
    } else {
        addToast('Benachrichtigungen abgelehnt, Timer-Notification nicht aktiv.', 'error')
    }
}

const storagePersisted = ref<boolean | null>(null)
onMounted(async () => {
    if (navigator.storage?.persisted) {
        storagePersisted.value = await navigator.storage.persisted()
    }
})

async function requestPersistence() {
    if (!navigator.storage?.persist) return
    const result = await navigator.storage.persist()
    storagePersisted.value = result
    if (result) {
        addToast('Persistenter Speicher aktiviert.')
    } else {
        addToast('Persistenter Speicher wurde nicht gewährt.', 'error')
    }
}

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

        <!-- Preferred Metric -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
                <h2 class="font-medium">Bevorzugte Metrik</h2>
                <p class="text-sm text-text-muted mt-1">Wird auf der Session-Übersicht zuerst angezeigt und in der Wochenstatistik verwendet.</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <button
                    v-for="opt in METRIC_OPTIONS"
                    :key="opt.value"
                    @click="setPreferred(opt.value)"
                    :class="[
                        'rounded-xl py-2.5 text-xs font-medium transition-colors border',
                        preferred === opt.value
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-surface/60 border-transparent text-text-muted hover:text-text'
                    ]"
                >
                    {{ opt.label }}
                </button>
            </div>
        </div>

        <!-- Pause Timer -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div>
                <h2 class="font-medium">Pause-Timer</h2>
                <p class="text-sm text-text-muted mt-1">Automatischer Countdown nach jedem abgehakten Satz.</p>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Timer aktivieren</span>
                <button
                    @click="timerEnabled = !timerEnabled"
                    class="relative w-11 h-6 rounded-full transition-colors shrink-0"
                    :class="timerEnabled ? 'bg-primary-500' : 'bg-surface-hover border border-border'"
                >
                    <span
                        class="absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform duration-200"
                        :class="timerEnabled ? 'translate-x-5' : 'translate-x-0'"
                    />
                </button>
            </div>
            <div v-if="timerEnabled" class="flex items-center gap-3">
                <span class="text-sm text-text-muted flex-1">Pausendauer</span>
                <div class="flex items-center gap-2">
                    <button
                        @click="timerDuration = Math.max(15, timerDuration - 15)"
                        class="size-8 flex items-center justify-center bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm transition-colors"
                    >-</button>
                    <span class="text-sm font-semibold w-16 text-center">
                        {{ Math.floor(timerDuration / 60) > 0 ? `${Math.floor(timerDuration / 60)} min ` : '' }}{{ timerDuration % 60 > 0 ? `${timerDuration % 60}s` : '' }}
                    </span>
                    <button
                        @click="timerDuration = timerDuration + 15"
                        class="size-8 flex items-center justify-center bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm transition-colors"
                    >+</button>
                </div>
            </div>
            <div v-if="timerEnabled" class="flex items-center justify-between">
                <span class="text-sm font-medium">Timer automatisch schließen</span>
                <button
                    @click="timerAutoClose = !timerAutoClose"
                    class="relative w-11 h-6 rounded-full transition-colors shrink-0"
                    :class="timerAutoClose ? 'bg-primary-500' : 'bg-surface-hover border border-border'"
                >
                    <span
                        class="absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform duration-200"
                        :class="timerAutoClose ? 'translate-x-5' : 'translate-x-0'"
                    />
                </button>
            </div>
            <div v-if="timerEnabled" class="flex items-center justify-between">
                <div class="flex-1 min-w-0 mr-4">
                    <span class="text-sm font-medium block">Benachrichtigung bei Ablauf</span>
                    <span v-if="notificationPermission === 'denied'" class="text-xs text-red-400 mt-0.5 block">
                        Im Browser blockiert
                    </span>
                </div>
                <button
                    @click="toggleTimerNotification"
                    class="relative w-11 h-6 rounded-full transition-colors shrink-0"
                    :class="timerNotificationEnabled && notificationPermission === 'granted' ? 'bg-primary-500' : 'bg-surface-hover border border-border'"
                >
                    <span
                        class="absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform duration-200"
                        :class="timerNotificationEnabled && notificationPermission === 'granted' ? 'translate-x-5' : 'translate-x-0'"
                    />
                </button>
            </div>
        </div>

        <!-- Storage Persistence -->
        <div class="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div>
                <h2 class="font-medium">Datenpersistenz</h2>
                <p class="text-sm text-text-muted mt-1">Verhindert, dass der Browser IndexedDB-Daten bei Speicherknappheit automatisch löscht.</p>
            </div>
            <div v-if="storagePersisted === null" class="text-sm text-text-muted">Nicht unterstützt</div>
            <template v-else>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm font-medium">
                        <span
                            class="size-2 rounded-full"
                            :class="storagePersisted ? 'bg-green-500' : 'bg-yellow-500'"
                        />
                        {{ storagePersisted ? 'Persistenter Speicher aktiv' : 'Speicher nicht persistent' }}
                    </div>
                    <button
                        v-if="!storagePersisted"
                        @click="requestPersistence"
                        class="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg font-medium transition-colors hover:bg-primary-600"
                    >
                        Aktivieren
                    </button>
                </div>
            </template>
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
                    class="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-text rounded-xl py-3 font-semibold text-sm transition-colors"
                >
                    <IconUpload class="size-5" />
                    Daten exportieren
                </button>

                <button
                    @click="triggerImport"
                    :disabled="importing"
                    class="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover disabled:opacity-40 text-text rounded-xl py-3 font-semibold text-sm transition-colors"
                >
                    <IconLoaderCircle v-if="importing" class="size-5 animate-spin" />
                    <IconDownload v-else class="size-5" />
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

        <!-- Version -->
        <div class="text-center text-xs text-text-muted pb-2">
            Version {{ appVersion }}
        </div>
    </div>
</template>

