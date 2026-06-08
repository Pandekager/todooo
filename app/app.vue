<template>
    <div
        class="min-h-screen bg-white dark:bg-#1a1a1a text-#333 dark:text-#ccc font-sans transition-colors"
    >
        <AppNavbar />
        <main class="max-w-2xl mx-auto px-4 pt-22 pb-12">
            <h1 class="text-2xl font-bold text-center mb-8">
                Todooo
            </h1>
            <ClientOnly>
                <ItemList
                    :active-items="activeItems"
                    :completed-items="completedItems"
                    :has-loaded="hasLoaded"
                    @add="addItem"
                    @toggle="toggleItem"
                    @edit="updateText"
                    @reorder="reorderItems"
                />
                <template #fallback>
                    <div
                        class="text-center text-lg text-#888 dark:text-#999 mt-16"
                    >
                        ...
                    </div>
                </template>
            </ClientOnly>
        </main>
    </div>
</template>

<script setup lang="ts">
const {
    activeItems,
    completedItems,
    fetchItems,
    addItem,
    toggleItem,
    updateText,
    reorderItems,
} = useItems();
const hasLoaded = ref(false);

onMounted(async () => {
    await fetchItems();
    hasLoaded.value = true;
});
</script>
