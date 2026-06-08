<script setup lang="ts">
const { initTheme } = useTheme()
onMounted(async () => {
    initTheme()
    if (navigator.storage?.persist) {
        await navigator.storage.persist()
    }
})

useHead({
    title: 'REPLOG',
    meta: [
        { name: 'theme-color', content: '#171717' },
    ]
})
</script>

<template>
    <VitePwaManifest />
    <NuxtLayout>
        <NuxtPage></NuxtPage>
    </NuxtLayout>
</template>
