<template>
  <div>
    <div v-if="!hasLoaded" class="text-center text-lg text-#888 dark:text-#999 mt-16">
      ...
    </div>
    <template v-else>
      <div v-if="activeItems.length === 0 && completedItems.length === 0" class="text-center text-lg text-#888 dark:text-#999 mt-16">
        Ingen ting på listen — ingen problemer :)
      </div>
      <div v-for="item in activeItems" :key="item.id">
        <ItemDisplay :item="item" @toggle="$emit('toggle', item)" @edit="(id, text) => $emit('edit', id, text)" />
      </div>
      <QuickAdd @add="$emit('add', $event)" />
      <div v-if="completedItems.length > 0" class="mt-8 border-t border-#eee dark:border-#333 pt-4">
        <button
          class="flex items-center gap-2 text-sm text-#888 dark:text-#999 hover:text-#333 dark:hover:text-#ccc transition-colors cursor-pointer w-full text-left"
          @click="expanded = !expanded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ 'rotate-90': expanded }"
            class="transition-transform"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Arkiv ({{ completedItems.length }})
        </button>
        <div v-if="expanded" class="mt-2">
          <div v-for="item in completedItems" :key="item.id">
            <ItemDisplay :item="item" @toggle="$emit('toggle', item)" @edit="(id, text) => $emit('edit', id, text)" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'

defineProps<{
  activeItems: Item[]
  completedItems: Item[]
  hasLoaded: boolean
}>()

const emit = defineEmits<{
  add: [text: string]
  toggle: [item: Item]
  edit: [id: number, text: string]
}>()

const expanded = ref(false)
</script>
