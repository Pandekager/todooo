<template>
  <div
    class="flex items-center gap-3 py-1 px-0 text-base text-#333 dark:text-#ccc"
    tabindex="0"
    role="button"
  >
    {{ item.text }}
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'

defineProps<{
  item: Item
}>()
</script>
