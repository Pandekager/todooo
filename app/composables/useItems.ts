import { ref, computed } from 'vue'

export interface Item {
  id: number
  text: string
  checked: number
  checked_at: number | null
  order: number
}

export function useItems() {
  const items = ref<Item[]>([])

  const activeItems = computed(() =>
    items.value.filter(i => !i.checked).sort((a, b) => a.order - b.order)
  )

  const completedItems = computed(() =>
    items.value.filter(i => i.checked).sort((a, b) => (b.checked_at ?? 0) - (a.checked_at ?? 0))
  )

  const archiveCount = computed(() => completedItems.value.length)

  async function fetchItems() {
    const data = await $fetch<{ active: Item[], completed: Item[] }>('/api/items')
    items.value = [...data.active, ...data.completed]
  }

  async function addItem(text: string) {
    const item = await $fetch<Item>('/api/items', {
      method: 'POST',
      body: { text },
    })
    items.value.push(item)
  }

  async function toggleItem(item: Item) {
    const updated = await $fetch<Item>(`/api/items/${item.id}`, {
      method: 'PATCH',
    })
    const index = items.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      items.value[index] = updated
    }
  }

  async function updateText(id: number, text: string) {
    const trimmed = text.trim()
    if (trimmed.length === 0) return

    const item = items.value.find(i => i.id === id)
    if (!item) return

    const original = item.text
    item.text = trimmed

    try {
      await $fetch<Item>(`/api/items/${id}`, {
        method: 'PATCH',
        body: { text: trimmed },
      })
    } catch (e) {
      item.text = original
      throw e
    }
  }

  return {
    items,
    activeItems,
    completedItems,
    archiveCount,
    fetchItems,
    addItem,
    toggleItem,
    updateText,
  }
}
