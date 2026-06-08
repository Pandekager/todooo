import { describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockItems: any[] = []
let mockFetch: typeof globalThis.$fetch

beforeEach(() => {
  mockItems.length = 0
  mockFetch = globalThis.$fetch
  globalThis.$fetch = async (url: string, opts?: any) => {
    if (url === '/api/items' && (!opts || opts.method === 'GET')) {
      const active = mockItems
        .filter(i => !i.checked)
        .sort((a, b) => a.order - b.order)
      const completed = mockItems
        .filter(i => i.checked)
        .sort((a, b) => b.checked_at - a.checked_at)
      return { active, completed }
    }
    if (url === '/api/items' && opts?.method === 'POST') {
      const text = opts.body.text
      const order = mockItems.filter(i => !i.checked).length
      const item = { id: mockItems.length + 1, text, checked: 0, checked_at: null, order }
      mockItems.push(item)
      return item
    }
    const patchMatch = url.match(/^\/api\/items\/(\d+)$/)
    if (patchMatch && opts?.method === 'PATCH') {
      const id = Number(patchMatch[1])
      const item = mockItems.find(i => i.id === id)
      if (!item) throw new Error('not found')
      if (opts.body && typeof opts.body.text === 'string') {
        item.text = opts.body.text.trim()
      } else {
        const newChecked = item.checked ? 0 : 1
        item.checked = newChecked
        item.checked_at = newChecked ? Date.now() : null
      }
      return { ...item }
    }
    throw new Error(`unexpected fetch: ${url}`)
  }
})

afterEach(() => {
  globalThis.$fetch = mockFetch
})

describe('useItems', () => {
  it('fetches items and populates reactive state', async () => {
    mockItems.push(
      { id: 1, text: 'A', checked: 0, checked_at: null, order: 0 },
      { id: 2, text: 'B', checked: 0, checked_at: null, order: 1 },
    )

    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, fetchItems } = useItems()

    await fetchItems()

    expect(items.value).toHaveLength(2)
    expect(activeItems.value).toHaveLength(2)
    expect(activeItems.value.map(i => i.text)).toEqual(['A', 'B'])
  })

  it('splits items into active and completed', async () => {
    mockItems.push(
      { id: 1, text: 'Active', checked: 0, checked_at: null, order: 0 },
      { id: 2, text: 'Done', checked: 1, checked_at: 200, order: 1 },
      { id: 3, text: 'Older done', checked: 1, checked_at: 100, order: 2 },
    )

    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, completedItems, fetchItems } = useItems()

    await fetchItems()

    expect(items.value).toHaveLength(3)
    expect(activeItems.value.map(i => i.text)).toEqual(['Active'])
    expect(completedItems.value.map(i => i.text)).toEqual(['Done', 'Older done'])
  })

  it('adds an item to the bottom of the active list', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, addItem } = useItems()

    await addItem('First')
    expect(activeItems.value.map(i => i.text)).toEqual(['First'])
    expect(activeItems.value[0].order).toBe(0)

    await addItem('Second')
    expect(activeItems.value.map(i => i.text)).toEqual(['First', 'Second'])
    expect(activeItems.value[1].order).toBe(1)

    expect(items.value).toHaveLength(2)
  })

  it('fetchItems replaces existing state', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, fetchItems, addItem } = useItems()

    await addItem('Temp')
    expect(activeItems.value).toHaveLength(1)

    mockItems.length = 0
    await fetchItems()
    expect(items.value).toHaveLength(0)
    expect(activeItems.value).toHaveLength(0)
  })

  it('toggleItem checks an active item and moves it to completed', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, completedItems, fetchItems, toggleItem } = useItems()

    mockItems.push({ id: 1, text: 'A', checked: 0, checked_at: null, order: 0 })
    await fetchItems()

    expect(activeItems.value).toHaveLength(1)
    expect(completedItems.value).toHaveLength(0)

    await toggleItem(items.value[0])

    expect(activeItems.value).toHaveLength(0)
    expect(completedItems.value).toHaveLength(1)
    expect(completedItems.value[0].checked).toBe(1)
    expect(completedItems.value[0].checked_at).toBeTypeOf('number')
  })

  it('toggleItem unchecks a completed item and returns it to active', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, completedItems, fetchItems, toggleItem } = useItems()

    mockItems.push(
      { id: 1, text: 'A', checked: 0, checked_at: null, order: 0 },
      { id: 2, text: 'Done', checked: 1, checked_at: 100, order: 1 },
    )
    await fetchItems()

    expect(activeItems.value).toHaveLength(1)
    expect(completedItems.value).toHaveLength(1)

    await toggleItem(items.value[1])

    expect(activeItems.value).toHaveLength(2)
    expect(activeItems.value.map(i => i.text)).toEqual(['A', 'Done'])
    expect(completedItems.value).toHaveLength(0)
    expect(items.value[1].checked).toBe(0)
    expect(items.value[1].checked_at).toBeNull()
  })

  it('archiveCount reflects completed items', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { archiveCount, fetchItems } = useItems()

    mockItems.push(
      { id: 1, text: 'Active', checked: 0, checked_at: null, order: 0 },
      { id: 2, text: 'Done1', checked: 1, checked_at: 200, order: 1 },
      { id: 3, text: 'Done2', checked: 1, checked_at: 100, order: 2 },
    )
    await fetchItems()

    expect(archiveCount.value).toBe(2)
  })

  it('toggleItem restores item to previous order position', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, activeItems, completedItems, fetchItems, toggleItem } = useItems()

    mockItems.push(
      { id: 1, text: 'A', checked: 0, checked_at: null, order: 0 },
      { id: 2, text: 'B', checked: 0, checked_at: null, order: 1 },
      { id: 3, text: 'C', checked: 0, checked_at: null, order: 2 },
    )
    await fetchItems()
    expect(activeItems.value.map(i => i.text)).toEqual(['A', 'B', 'C'])

    await toggleItem(items.value[1])
    expect(activeItems.value.map(i => i.text)).toEqual(['A', 'C'])
    expect(completedItems.value.map(i => i.text)).toEqual(['B'])

    await toggleItem(items.value[1])
    expect(activeItems.value.map(i => i.text)).toEqual(['A', 'B', 'C'])
    expect(activeItems.value[1].order).toBe(1)
    expect(completedItems.value).toHaveLength(0)
  })

  it('updateText updates item text optimistically', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, addItem, updateText } = useItems()

    await addItem('Original')
    expect(items.value[0].text).toBe('Original')

    await updateText(items.value[0].id, 'Updated')
    expect(items.value[0].text).toBe('Updated')

    const same = mockItems.find(i => i.id === items.value[0].id)
    expect(same.text).toBe('Updated')
  })

  it('updateText restores original on failure', async () => {
    const { useItems } = await import('../../app/composables/useItems')
    const { items, addItem, updateText } = useItems()

    await addItem('Original')
    expect(items.value[0].text).toBe('Original')

    const oldFetch = (globalThis as any).$fetch
    ;(globalThis as any).$fetch = async () => { throw new Error('network error') }

    await expect(updateText(items.value[0].id, 'Updated')).rejects.toThrow()
    expect(items.value[0].text).toBe('Original')

    ;(globalThis as any).$fetch = oldFetch
  })
})
