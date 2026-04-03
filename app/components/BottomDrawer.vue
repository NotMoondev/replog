<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
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
            <div
                v-if="open"
                class="fixed inset-0 bg-black/60 z-50"
                @click.self="emit('close')"
            >
                <Transition
                    appear
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="translate-y-full"
                    enter-to-class="translate-y-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="translate-y-0"
                    leave-to-class="translate-y-full"
                >
                    <div
                        v-if="open"
                        class="absolute bottom-0 inset-x-0 bg-card border-t border-border rounded-t-3xl p-6 pb-10 space-y-4"
                    >
                        <!-- Handle -->
                        <div class="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
                        <slot />
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
