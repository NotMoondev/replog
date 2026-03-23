<script setup lang="ts">
const { initTheme } = useTheme()
onMounted(() => initTheme())

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
