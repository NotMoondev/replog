<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{
    'update:open': [value: boolean]
    confirm: []
}>()
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <Transition
                    appear
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                >
                    <div class="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-sm w-full">
                        <h3 class="font-semibold text-lg text-text">Training abbrechen?</h3>
                        <p class="text-sm text-text-muted">Der Fortschritt dieser Session wird verworfen und kann nicht wiederhergestellt werden.</p>
                        <div class="flex gap-3">
                            <button
                                @click="emit('update:open', false)"
                                class="flex-1 bg-surface text-text hover:bg-surface-hover rounded-xl py-2.5 font-semibold text-sm transition-colors"
                            >
                                Weitertrainieren
                            </button>
                            <button
                                @click="emit('confirm')"
                                class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
