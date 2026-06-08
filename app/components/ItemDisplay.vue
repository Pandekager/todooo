<template>
  <div
    class="flex items-center gap-3 py-1 px-0 text-base"
    :class="item.checked
      ? 'text-#aaa dark:text-#666 line-through'
      : 'text-#333 dark:text-#ccc'"
    tabindex="0"
    role="button"
    @keydown.space.prevent="$emit('toggle')"
    @click.stop="$emit('toggle')"
  >
    <span
      class="inline-flex items-center justify-center w-5 h-5 rounded border-1.5 cursor-pointer shrink-0 transition-colors"
      :class="item.checked
        ? 'bg-#4a9eff border-#4a9eff text-white'
        : 'border-#bbb dark:border-#666 hover:border-#4a9eff'"
    >
      <svg v-if="item.checked" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
    {{ item.text }}
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'

defineProps<{
  item: Item
}>()

defineEmits<{
  toggle: []
}>()
</script>
