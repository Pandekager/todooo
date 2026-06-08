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
})
