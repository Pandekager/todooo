<template>
  <div
    class="flex items-center gap-3 py-1 px-0 text-base"
    :class="item.checked
      ? 'text-#aaa dark:text-#666 line-through'
      : 'text-#333 dark:text-#ccc'"
    tabindex="0"
    role="button"
    @keydown.space.prevent="$emit('toggle')"
    @keydown.enter.prevent="enterEdit"
    @keydown.meta.up.prevent="$emit('moveup')"
    @keydown.meta.down.prevent="$emit('movedown')"
  >
    <template v-if="editing">
      <input
        ref="inputEl"
        v-model="editText"
        type="text"
        class="flex-1 bg-transparent border-none outline-none py-0 px-0 text-base text-#333 dark:text-#ccc"
        @keydown.enter.prevent="save"
        @keydown.escape.prevent="cancel"
        @blur="save"
      />
    </template>
    <template v-else>
      <span class="drag-handle inline-flex items-center justify-center w-5 h-5 cursor-grab shrink-0 text-#bbb dark:text-#666 hover:text-#888 dark:hover:text-#888 transition-colors"
        title="Træk for at omarrangere">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
        </svg>
      </span>
      <span
        class="inline-flex items-center justify-center w-5 h-5 rounded border-1.5 cursor-pointer shrink-0 transition-colors"
        :class="item.checked
          ? 'bg-#4a9eff border-#4a9eff text-white'
          : 'border-#bbb dark:border-#666 hover:border-#4a9eff'"
        @click.stop="$emit('toggle')"
      >
        <svg v-if="item.checked" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span class="cursor-pointer flex-1" @click="enterEdit">{{ item.text }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'

const props = defineProps<{
  item: Item
}>()

const emit = defineEmits<{
  toggle: []
  edit: [id: number, text: string]
  moveup: []
  movedown: []
}>()

const editing = ref(false)
const editText = ref('')
const inputEl = ref<HTMLInputElement>()

function enterEdit() {
  editText.value = props.item.text
  editing.value = true
  nextTick(() => {
    inputEl.value?.focus()
    inputEl.value?.select()
  })
}

function save() {
  if (!editing.value) return
  editing.value = false
  const trimmed = editText.value.trim()
  if (trimmed.length === 0 || trimmed === props.item.text) return
  emit('edit', props.item.id, trimmed)
}

function cancel() {
  editing.value = false
  editText.value = props.item.text
}
</script>
