<template>
  <div>
    <div v-if="items.length === 0 && !hasLoaded" class="text-center text-lg text-#888 dark:text-#999 mt-16">
      Ingen ting på listen — ingen problemer :)
    </div>
    <div v-for="item in items" :key="item.id">
      <ItemDisplay :item="item" />
    </div>
    <QuickAdd @add="(t: string) => $emit('add', t)" />
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'

defineProps<{
  items: Item[]
  hasLoaded: boolean
}>()

defineEmits<{
  add: [text: string]
}>()
</script>
