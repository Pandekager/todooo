<template>
    <div
        class="min-h-screen bg-white dark:bg-#1a1a1a text-#333 dark:text-#ccc font-sans transition-colors"
    >
        <ClientOnly>
            <AppNavbar />
            <template #fallback>
                <nav class="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-white dark:bg-#1a1a1a border-b border-#eee dark:border-#333">
                    <h1 class="text-lg font-bold text-#333 dark:text-#ccc">Todooo</h1>
                    <div class="w-5 h-5" />
                </nav>
            </template>
        </ClientOnly>
        <main class="max-w-2xl mx-auto px-4 pt-22 pb-12">
            <h1 class="text-2xl font-bold text-center mb-8">
                Hvad skal der ske i dag? >:)
            </h1>
            <ClientOnly>
                <div v-if="error" class="mb-4 p-3 bg-#fff3cd dark:bg-#664d00 text-#856404 dark:text-#ffd970 rounded text-sm flex items-center justify-between">
                    {{ error }}
                    <button class="ml-2 opacity-60 hover:opacity-100 cursor-pointer font-bold" @click="error = ''">&times;</button>
                </div>
                <ItemList
                    :active-items="activeItems"
                    :completed-items="completedItems"
                    :has-loaded="hasLoaded"
                    @add="handleAdd"
                    @toggle="handleToggle"
                    @edit="handleEdit"
                    @reorder="handleReorder"
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
const error = ref('');

onMounted(async () => {
    try {
        await fetchItems();
    } catch {
        error.value = 'Kunne ikke hente listen — prøv at genindlæs siden'
    }
    hasLoaded.value = true;
});

async function handleAdd(text: string) {
    try { await addItem(text) } catch { error.value = 'Kunne ikke tilføje — prøv igen' }
}

async function handleToggle(item: Item) {
    try { await toggleItem(item) } catch { error.value = 'Kunne ikke ændre — prøv igen' }
}

async function handleEdit(id: number, text: string) {
    try { await updateText(id, text) } catch { error.value = 'Kunne ikke gemme — prøv igen' }
}

async function handleReorder(items: Item[]) {
    try { await reorderItems(items) } catch { error.value = 'Kunne ikke ændre rækkefølge — prøv igen' }
}

type Item = { id: number; text: string; checked: number; checked_at: number | null; order: number }
</script>
