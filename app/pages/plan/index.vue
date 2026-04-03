<script setup lang="ts">
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'

const store = useTrainingPlanStore()
const router = useRouter()
const newPlanName = ref('')
const showCreateDrawer = ref(false)
const confirmingDeleteId = ref<string | null>(null)
const importInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

onMounted(() => {
    store.loadPlans()
})

async function create() {
    const trimmed = newPlanName.value.trim()
    if (!trimmed) return
    const plan = await store.createPlan(trimmed)
    newPlanName.value = ''
    showCreateDrawer.value = false
    router.push(`/plan/${plan.id}`)
}

async function handleImport(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    importing.value = true
    try {
        await store.importPlan(file)
    } catch (e: any) {
        useToast().addToast(e.message ?? 'Import fehlgeschlagen', 'error')
    } finally {
        importing.value = false
        if (importInput.value) importInput.value.value = ''
    }
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-semibold">Trainingspläne</h1>
            <div class="flex items-center gap-2">
                <!-- Import -->
                <input
                    ref="importInput"
                    type="file"
                    accept=".json,application/json"
                    class="hidden"
                    @change="handleImport"
                />
                <button
                    @click="importInput?.click()"
                    :disabled="importing"
                    class="bg-surface border border-border hover:border-primary-500 text-text rounded-xl px-3 py-2 text-sm transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    title="Plan importieren"
                >
                    <IconLoaderCircle v-if="importing" class="size-4 animate-spin" />
                    <IconDownload v-else class="size-4" />
                </button>
                <button
                    @click="showCreateDrawer = true"
                    class="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 font-semibold text-sm transition-colors flex items-center gap-1.5 shrink-0"
                >
                    <IconPlus class="size-4" /> Erstellen
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="flex justify-center py-10">
            <IconLoaderCircle class="size-8 animate-spin text-primary-500" />
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
            <div
                v-for="plan in store.plans"
                :key="plan.id"
                class="bg-card border rounded-2xl p-4 flex justify-between items-center"
                :class="plan.isActive ? 'border-primary-500/60' : 'border-border hover:border-surface-hover'"
            >
                <div>
                    <div class="font-semibold text-sm flex items-center gap-2">
                        {{ plan.name }}
                        <span v-if="plan.isActive"
                            class="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
                            Aktiv
                        </span>
                    </div>
                    <div class="text-xs text-text-muted">
                        {{ plan.days.filter(d => !d.isRestDay).length }} Trainingstage
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button
                        v-if="!plan.isActive"
                        @click="store.setActivePlan(plan.id)"
                        class="text-sm text-primary-400 hover:text-primary-500"
                    >
                        Aktivieren
                    </button>

                    <!-- Delete with inline confirm -->
                    <template v-if="confirmingDeleteId === plan.id">
                        <button
                            @click="store.deletePlan(plan.id); confirmingDeleteId = null"
                            class="text-red-400 hover:text-red-300 text-sm font-medium transition"
                        >
                            Löschen
                        </button>
                        <button @click="confirmingDeleteId = null" class="text-text-muted hover:text-text transition">
                            <IconX class="size-4" />
                        </button>
                    </template>
                    <button
                        v-else
                        @click="confirmingDeleteId = plan.id"
                        class="text-text-muted hover:text-red-400 transition-colors"
                    >
                        <IconTrash2 class="size-4" />
                    </button>

                    <button
                        @click="store.exportPlan(plan.id)"
                        class="text-text-muted hover:text-primary-400 transition-colors"
                        title="Plan exportieren"
                    >
                        <IconShare2 class="size-4" />
                    </button>

                    <NuxtLink
                        :to="`/plan/${plan.id}`"
                        class="text-sm text-text-muted hover:text-primary-400 flex items-center gap-1"
                    >
                        <IconPen class="size-4" />
                    </NuxtLink>

                </div>
            </div>

            <!-- Empty state -->
            <div v-if="store.plans.length === 0" class="text-center py-16 space-y-2">
                <IconCalendar class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Trainingspläne vorhanden.</p>
                <p class="text-xs text-text-muted">Tippe auf "Erstellen" um deinen ersten Plan anzulegen.</p>
            </div>
        </div>
    </div>

    <!-- Create Drawer -->
    <BottomDrawer :open="showCreateDrawer" @close="showCreateDrawer = false; newPlanName = ''">
        <h2 class="font-semibold text-lg">Neuer Trainingsplan</h2>
        <input
            v-model="newPlanName"
            placeholder="Name des Plans"
            @keyup.enter="create"
            autofocus
            class="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
        />
        <button
            @click="create"
            :disabled="!newPlanName.trim()"
            class="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
        >
            Erstellen
        </button>
    </BottomDrawer>
</template>

