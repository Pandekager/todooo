<template>
  <div>
    <div v-if="!hasLoaded" class="text-center text-lg text-#888 dark:text-#999 mt-16">
      ...
    </div>
    <template v-else>
      <div v-if="activeItems.length === 0 && completedItems.length === 0" class="text-center text-lg text-#888 dark:text-#999 mt-16">
        Ingen ting på listen — ingen problemer :)
      </div>
      <TransitionGroup
        v-else
        tag="div"
        name="list"
        class="relative"
        :ref="(el: any) => { if (el?.$el) parentRef = el.$el }"
      >
        <div v-for="item in valuesRef" :key="item.id">
          <ItemDisplay
            :item="item"
            @toggle="$emit('toggle', item)"
            @edit="(id, text) => $emit('edit', id, text)"
            @moveup="moveUp(item)"
            @movedown="moveDown(item)"
          />
        </div>
      </TransitionGroup>
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
        <Transition name="archive">
          <TransitionGroup v-if="expanded" tag="div" name="list" class="mt-2">
            <div v-for="item in completedItems" :key="item.id">
              <ItemDisplay :item="item" @toggle="$emit('toggle', item)" @edit="(id, text) => $emit('edit', id, text)" />
            </div>
          </TransitionGroup>
        </Transition>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../composables/useItems'
import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
import { watch, ref } from 'vue'

const props = defineProps<{
  activeItems: Item[]
  completedItems: Item[]
  hasLoaded: boolean
}>()

const emit = defineEmits<{
  add: [text: string]
  toggle: [item: Item]
  edit: [id: number, text: string]
  reorder: [items: Item[]]
}>()

const expanded = ref(false)

const [parentRef, valuesRef] = useDragAndDrop<Item>([...props.activeItems], {
  dragHandle: '.drag-handle',
  onSort: (data) => {
    emit('reorder', data.values as Item[])
  },
})

watch(() => props.activeItems, (items) => {
  valuesRef.value = [...items]
})

function moveUp(item: Item) {
  const idx = valuesRef.value.findIndex(i => i.id === item.id)
  if (idx <= 0) return
  const reordered = [...valuesRef.value]
  const a = reordered[idx - 1]
  const b = reordered[idx]
  if (!a || !b) return
  reordered[idx - 1] = b
  reordered[idx] = a
  emit('reorder', reordered)
}

function moveDown(item: Item) {
  const idx = valuesRef.value.findIndex(i => i.id === item.id)
  if (idx < 0 || idx >= valuesRef.value.length - 1) return
  const reordered = [...valuesRef.value]
  const a = reordered[idx]
  const b = reordered[idx + 1]
  if (!a || !b) return
  reordered[idx] = b
  reordered[idx + 1] = a
  emit('reorder', reordered)
}
</script>

<style>
.list-enter-active,
.list-leave-active,
.list-move {
  transition: all 0.25s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

.list-leave-active {
  position: absolute;
}

.list-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

.archive-enter-active,
.archive-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.archive-enter-from,
.archive-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .list-enter-active,
  .list-leave-active,
  .list-move,
  .archive-enter-active,
  .archive-leave-active {
    transition: none;
  }
}
</style>
