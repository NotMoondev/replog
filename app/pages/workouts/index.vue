<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useSessionStore } from '~/stores/useSessionStore'
import { useActiveSession } from '~/composables/useActiveSession'
import { useFormatters } from '~/composables/useFormatters'

const store = useWorkoutStore()
const sessionStore = useSessionStore()
const activeSession = useActiveSession()
const { showConflict, navigateTo, confirmDiscard, confirmResume, cancel: cancelConflict } = activeSession.useConflictGuard()
const showCreateDrawer = ref(false)
const newName = ref('')
const showArchiveDrawer = ref(false)
const confirmDeleteId = ref<string | null>(null)
const { formatLastSession } = useFormatters()

onMounted(async () => {
    await Promise.all([store.loadWorkouts(), sessionStore.loadAllSessions()])
})

async function create() {
    const trimmed = newName.value.trim()
    if (!trimmed) return
    await store.createWorkout(trimmed)
    newName.value = ''
    showCreateDrawer.value = false
}

function lastSessionLabel(workoutId: string): string | null {
    const last = sessionStore.allSessions.find(s => s.workoutId === workoutId)
    return last ? formatLastSession(last.date) : null
}

async function handleUnarchive(id: string) {
    await store.unarchiveWorkout(id)
}

async function handlePermanentDelete(id: string) {
    await store.deleteWorkout(id)
    confirmDeleteId.value = null
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold">Workouts</h1>
            <div class="flex items-center gap-2">
                <NuxtLink
                    to="/plan"
                    class="flex items-center justify-center size-9 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors text-text-muted hover:text-text"
                    title="Trainingspläne"
                >
                    <IconCalendar class="size-4" />
                </NuxtLink>
                <button
                    @click="showArchiveDrawer = true"
                    class="flex items-center justify-center size-9 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors text-text-muted hover:text-text"
                    title="Archiv"
                >
                    <IconArchive class="size-4" />
                </button>
                <button
                    @click="showCreateDrawer = true"
                    class="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 font-semibold text-sm transition-colors flex items-center gap-1.5"
                >
                    <IconPlus class="size-4" /> Erstellen
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <!-- Workout List -->
        <div v-else class="space-y-3">
            <div v-for="w in store.workouts" :key="w.id" class="relative">
                <!-- Clickable card -->
                <NuxtLink
                    :to="`/workouts/${w.id}`"
                    class="block bg-card border border-border rounded-2xl p-4 hover:border-surface-hover transition-colors pr-28"
                >
                    <div class="font-semibold text-sm">{{ w.name }}</div>
                    <div class="text-xs text-text-muted mt-0.5 space-x-2">
                        <span>{{ w.exercises.length }} Übungen</span>
                        <span v-if="lastSessionLabel(w.id)" class="text-text-muted/70">· {{ lastSessionLabel(w.id) }}</span>
                    </div>
                </NuxtLink>

                <!-- Start button positioned over card -->
                <button
                    :disabled="w.exercises.length === 0"
                    :class="[
                        'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 font-semibold transition-colors shrink-0',
                        w.exercises.length > 0
                            ? 'bg-primary-500 hover:bg-primary-600 text-white cursor-pointer'
                            : 'bg-primary-500/40 text-white/60 cursor-not-allowed'
                    ]"
                    @click.stop="w.exercises.length > 0 && navigateTo(w.id, w.name)"
                >
                    <IconPlay class="size-3.5" />
                    Starten
                </button>
            </div>

            <!-- Empty state -->
            <div v-if="store.workouts.length === 0" class="text-center py-16 space-y-2">
                <IconDumbbell class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Workouts vorhanden.</p>
                <p class="text-xs text-text-muted">Tippe auf "Erstellen" um dein erstes Workout anzulegen.</p>
            </div>
        </div>
    </div>

    <!-- Create Drawer -->
    <BottomDrawer :open="showCreateDrawer" @close="showCreateDrawer = false; newName = ''">
        <h2 class="font-semibold text-lg text-text">Neues Workout</h2>
        <input
            v-model="newName"
            placeholder="Name des Workouts"
            @keyup.enter="create"
            autofocus
            class="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors placeholder:text-text-muted text-text"
        />
        <button
            @click="create"
            :disabled="!newName.trim()"
            class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
        >
            Erstellen
        </button>
    </BottomDrawer>

    <SessionConflictDialog
        :show="showConflict"
        @resume="confirmResume"
        @discard="confirmDiscard"
        @cancel="cancelConflict"
    />

    <!-- Archive Drawer -->
    <BottomDrawer :open="showArchiveDrawer" @close="showArchiveDrawer = false; confirmDeleteId = null">
        <div class="flex items-center gap-2 mb-1">
            <IconArchive class="size-4 text-text-muted" />
            <h2 class="font-semibold text-lg text-text">Archiv</h2>
        </div>
        <div v-if="store.archivedWorkouts.length === 0" class="text-center py-8 text-sm text-text-muted">
            Keine archivierten Workouts.
        </div>
        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
                v-for="w in store.archivedWorkouts"
                :key="w.id"
                class="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-3"
            >
                <div class="min-w-0">
                    <div class="font-semibold text-sm truncate text-text-muted">{{ w.name }}</div>
                    <div class="text-xs text-text-muted/60 mt-0.5">{{ w.exercises.length }} Übungen</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button
                        @click="handleUnarchive(w.id)"
                        class="flex items-center gap-1.5 text-xs bg-surface hover:bg-surface-hover border border-border rounded-lg px-3 py-1.5 font-medium text-text-muted hover:text-text transition-colors"
                        title="Aus Archiv entfernen"
                    >
                        <IconArchiveRestore class="size-3.5" />
                        Wiederherstellen
                    </button>
                    <template v-if="confirmDeleteId === w.id">
                        <button
                            @click="handlePermanentDelete(w.id)"
                            class="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors"
                        >
                            Löschen
                        </button>
                        <button
                            @click="confirmDeleteId = null"
                            class="flex items-center justify-center size-7 bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors text-text-muted"
                        >
                            <IconX class="size-3.5" />
                        </button>
                    </template>
                    <button
                        v-else
                        @click="confirmDeleteId = w.id"
                        class="flex items-center justify-center size-7 bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors text-text-muted hover:text-red-400"
                        title="Endgültig löschen"
                    >
                        <IconTrash2 class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
        <p v-if="confirmDeleteId" class="text-xs text-text-muted/70 text-center pt-1">
            Achtung: Vergangene Sessions dieses Workouts werden danach nicht mehr vollständig angezeigt.
        </p>
    </BottomDrawer>
</template>

