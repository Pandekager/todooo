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

  let nextTempId = -1

  async function addItem(text: string) {
    const tempItem: Item = { id: nextTempId--, text, checked: 0, checked_at: null, order: activeItems.value.length }
    items.value.push(tempItem)
    try {
      const item = await $fetch<Item>('/api/items', {
        method: 'POST',
        body: { text },
      })
      const idx = items.value.findIndex(i => i.id === tempItem.id)
      if (idx !== -1) items.value[idx] = item
    } catch {
      items.value = items.value.filter(i => i.id !== tempItem.id)
      throw new Error('Kunne ikke tilføje — prøv igen')
    }
  }

  async function toggleItem(item: Item) {
    const index = items.value.findIndex(i => i.id === item.id)
    if (index === -1) return
    const original = { ...items.value[index] }
    const now = Date.now()
    items.value[index] = { ...original, checked: original.checked ? 0 : 1, checked_at: original.checked ? null : now }
    try {
      const updated = await $fetch<Item>(`/api/items/${item.id}`, { method: 'PATCH' })
      items.value[index] = updated
    } catch {
      items.value[index] = original
      throw new Error('Kunne ikke ændre — prøv igen')
    }
  }

  async function reorderItems(reorderedItems: Item[]) {
    const payload = reorderedItems.map((item, index) => ({
      id: item.id,
      order: index,
    }))
    const original = items.value.map(i => ({ ...i }))
    for (const { id, order } of payload) {
      const item = items.value.find(i => i.id === id)
      if (item) item.order = order
    }
    try {
      await $fetch('/api/items/reorder', {
        method: 'PATCH',
        body: { items: payload },
      })
    } catch (e) {
      for (const orig of original) {
        const item = items.value.find(i => i.id === orig.id)
        if (item) item.order = orig.order
      }
      throw e
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
    reorderItems,
  }
}
