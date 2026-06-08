<template>
  <div
    class="flex items-center gap-3 py-1 px-0 text-base text-#333 dark:text-#ccc"
    tabindex="0"
    role="button"
    @keydown.enter.prevent="enterEdit"
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
  edit: [id: number, text: string]
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
