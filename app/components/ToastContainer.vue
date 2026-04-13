<script setup lang="ts">
const { toasts, removeToast } = useToast()
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-14 inset-x-0 z-50 flex flex-col gap-2 items-center pointer-events-none px-4">
            <TransitionGroup name="toast">
                <div
                    v-for="toast in toasts"
                    :key="toast.id"
                    class="pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 max-w-xs w-full"
                    :class="{
                        'bg-green-800 text-green-100': toast.type === 'success',
                        'bg-red-800 text-red-100': toast.type === 'error',
                        'bg-surface text-text': toast.type === 'info',
                    }"
                >
                    <IconCheck v-if="toast.type === 'success'" class="w-4 h-4 shrink-0" />
                    <IconX v-else-if="toast.type === 'error'" class="w-4 h-4 shrink-0" />
                    <IconInfo v-else class="w-4 h-4 shrink-0" />
                    <span class="flex-1">{{ toast.message }}</span>
                    <button
                        class="ml-1 shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                        @click="removeToast(toast.id)"
                        aria-label="Dismiss"
                    >
                        <IconX class="w-4 h-4" />
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active {
    transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
