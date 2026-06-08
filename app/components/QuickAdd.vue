<template>
  <input
    ref="inputEl"
    v-model="text"
    type="text"
    placeholder="Tilføj..."
    class="w-full bg-transparent border-none outline-none py-2 px-0 text-base text-#888 dark:text-#999 placeholder-#bbb dark:placeholder-#666"
    @keydown.enter="submit"
  />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  add: [text: string]
}>()

const text = ref('')
const inputEl = ref<HTMLInputElement>()

function submit() {
  const trimmed = text.value.trim()
  if (trimmed.length === 0) return
  emit('add', trimmed)
  text.value = ''
}

function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus })
</script>
