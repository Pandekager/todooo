<template>
  <div>
    <div v-if="items.length === 0 && hasLoaded" class="text-center text-lg text-#888 dark:text-#999 mt-16">
      Ingen ting på listen — ingen problemer :)
    </div>
    <div v-for="item in items" :key="item.id">
      <ItemDisplay :item="item" @edit="onItemEdit" />
    </div>
    <QuickAdd @add="$emit('add', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'

defineProps<{
  items: Item[]
  hasLoaded: boolean
}>()

const emit = defineEmits<{
  add: [text: string]
  edit: [id: number, text: string]
}>()

function onItemEdit(id: number, text: string) {
  emit('edit', id, text)
}
</script>
