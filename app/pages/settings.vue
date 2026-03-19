<script setup lang="ts">
import { exportAllData, importAllData } from '~/utils/exportImport'

const importing = ref(false)
const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

async function handleExport() {
    statusMessage.value = null
    try {
        await exportAllData()
        statusMessage.value = { type: 'success', text: 'Export erfolgreich!' }
    } catch (e) {
        statusMessage.value = {
            type: 'error',
            text: `Fehler beim Export: ${e instanceof Error ? e.message : String(e)}`,
        }
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
    statusMessage.value = null
    try {
        await importAllData(file)
        statusMessage.value = {
            type: 'success',
            text: 'Import erfolgreich! Daten wurden wiederhergestellt.',
        }
    } catch (e) {
        statusMessage.value = {
            type: 'error',
            text: `Fehler beim Import: ${e instanceof Error ? e.message : String(e)}`,
        }
    } finally {
        importing.value = false
    }
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <h1 class="text-2xl font-semibold">Einstellungen</h1>

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
                    class="w-full flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl py-3 font-medium transition"
                >
                    <IconDownload class="w-5 h-5" />
                    Daten exportieren
                </button>

                <button
                    @click="triggerImport"
                    :disabled="importing"
                    class="w-full flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition"
                >
                    <IconLoaderCircle v-if="importing" class="w-5 h-5 animate-spin" />
                    <IconUpload v-else class="w-5 h-5" />
                    Daten importieren
                </button>

                <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
            </div>

            <!-- Status message -->
            <div
                v-if="statusMessage"
                class="rounded-xl p-3 text-sm"
                :class="statusMessage.type === 'success'
                    ? 'bg-green-900/40 text-green-300'
                    : 'bg-red-900/40 text-red-300'"
            >
                {{ statusMessage.text }}
            </div>

            <!-- Warning note -->
            <div class="bg-neutral-800 rounded-xl p-3 text-xs text-text-muted space-y-1">
                <p class="font-medium text-text">⚠️ Hinweis zum Import</p>
                <p>Beim Importieren werden alle vorhandenen Daten unwiderruflich überschrieben. Mache vorher einen Export als Backup.</p>
            </div>
        </div>
    </div>
</template>
