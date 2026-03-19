<script setup lang="ts">
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
