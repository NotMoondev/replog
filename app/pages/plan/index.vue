<script setup lang="ts">
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'

const store = useTrainingPlanStore()
const router = useRouter()
const newPlanName = ref('')
const confirmingDeleteId = ref<string | null>(null)

onMounted(() => {
    store.loadPlans()
})

async function create() {
    const trimmed = newPlanName.value.trim()
    if (!trimmed) return
    const plan = await store.createPlan(trimmed)
    newPlanName.value = ''
    router.push(`/plan/${plan.id}`)
}
</script>

<template>
    <div class="min-h-full bg-bg text-text p-4 space-y-6">
        <h1 class="text-2xl font-semibold">Trainingspläne</h1>

        <!-- Create -->
        <div class="flex gap-2">
            <input
                v-model="newPlanName"
                placeholder="Neuer Plan"
                @keyup.enter="create"
                class="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
            />
            <button
                @click="create"
                class="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
                <IconPlus class="size-4" /> Erstellen
            </button>
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

                    <NuxtLink
                        :to="`/plan/${plan.id}`"
                        class="text-sm text-primary-400 hover:text-primary-500 flex items-center gap-1"
                    >
                        Bearbeiten <IconArrowRight class="size-4" />
                    </NuxtLink>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="store.plans.length === 0" class="text-center py-16 space-y-2">
                <IconCalendar class="size-10 text-text-muted mx-auto" />
                <p class="text-sm text-text-muted">Noch keine Trainingspläne vorhanden.</p>
                <p class="text-xs text-text-muted">Erstelle deinen ersten Plan oben.</p>
            </div>
        </div>
    </div>
</template>

