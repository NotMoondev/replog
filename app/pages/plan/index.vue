<script setup lang="ts">
import { useTrainingPlanStore } from '~/stores/useTrainingPlanStore'

const store = useTrainingPlanStore()
const router = useRouter()
const newPlanName = ref('')

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
        <div class="bg-card border border-border rounded-2xl p-3 flex gap-2">
            <input
                v-model="newPlanName"
                placeholder="Neuer Plan"
                class="flex-1 bg-neutral-600 rounded-lg p-2 px-3 text-sm outline-none"
            />
            <button
                @click="create"
                class="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 font-medium transition flex items-center gap-1"
            >
                <IconPlus class="w-4 h-4" /> Erstellen
            </button>
        </div>

        <!-- List -->
        <div class="space-y-3">
            <div
                v-for="plan in store.plans"
                :key="plan.id"
                class="bg-card border rounded-2xl p-4 flex justify-between items-center"
                :class="plan.isActive ? 'border-primary-500' : 'border-border'"
            >
                <div>
                    <div class="font-medium flex items-center gap-2">
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
                    <button
                        @click="store.deletePlan(plan.id)"
                        class="text-text-muted hover:text-primary-400"
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

            <div v-if="store.plans.length === 0" class="text-center text-text-muted text-sm py-10">
                Noch keine Pläne erstellt
            </div>
        </div>
    </div>
</template>
