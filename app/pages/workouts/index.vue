<script setup lang="ts">
import { useWorkoutStore } from '~/stores/useWorkoutStore'
import { useSessionStore } from '~/stores/useSessionStore'

const store = useWorkoutStore()
const sessionStore = useSessionStore()
const showCreateDrawer = ref(false)
const newName = ref('')

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
    if (!last) return null
    const date = new Date(last.date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Zuletzt: Heute'
    if (diffDays === 1) return 'Zuletzt: Gestern'
    if (diffDays < 7) return `Zuletzt: vor ${diffDays} Tagen`
    return `Zuletzt: ${date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}`
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold">Workouts</h1>
            <div class="flex items-center gap-2">
                <NuxtLink
                    to="/exercises"
                    class="flex items-center justify-center size-9 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors text-text-muted hover:text-text"
                    title="Übungsbibliothek"
                >
                    <IconListChecks class="size-4" />
                </NuxtLink>
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
                <NuxtLink
                    :to="`/session/${w.id}`"
                    class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors shrink-0"
                    @click.stop
                >
                    <IconPlay class="size-3.5" />
                    Starten
                </NuxtLink>
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
</template>

