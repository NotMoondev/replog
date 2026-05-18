<script setup lang="ts">
import { useActiveSession } from '~/composables/useActiveSession'

defineProps<{ show: boolean }>()

const emit = defineEmits<{
    resume: []
    discard: []
    cancel: []
}>()

const activeSession = useActiveSession()
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
            <div v-if="show" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <Transition
                    appear
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                >
                    <div class="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-sm w-full">
                        <h3 class="font-semibold text-lg text-text">Session läuft noch</h3>
                        <p class="text-sm text-text-muted">
                            Du hast noch eine aktive Session für
                            <span class="font-semibold text-text">„{{ activeSession.meta.value?.workoutName }}"</span>.
                            Was möchtest du tun?
                        </p>
                        <div class="flex flex-col gap-2">
                            <button
                                @click="emit('resume')"
                                class="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
                            >
                                Aktive Session fortsetzen
                            </button>
                            <button
                                @click="emit('discard')"
                                class="w-full bg-surface hover:bg-surface-hover border border-border text-text rounded-xl py-2.5 font-semibold text-sm transition-colors"
                            >
                                Session verwerfen &amp; neu starten
                            </button>
                            <button
                                @click="emit('cancel')"
                                class="w-full text-text-muted hover:text-text text-sm py-1.5 transition-colors"
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
