import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { Client } from '@libsql/client'
import { createApp, createRouter, toNodeListener, defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createTestDatabase } from '../../server/utils/database'

describe('database layer', () => {
  it('initializes items table and returns empty lists', async () => {
    const db = await createTestDatabase()

    const { rows: active } = await db.execute('SELECT * FROM items WHERE checked = 0 ORDER BY "order"')
    const { rows: completed } = await db.execute('SELECT * FROM items WHERE checked = 1 ORDER BY checked_at DESC')

    expect(active).toEqual([])
    expect(completed).toEqual([])

    db.close()
  })
})

describe('items API integration', () => {
  let db: Client
  let server: ReturnType<typeof createServer>
  let url: string

  beforeAll(async () => {
    db = await createTestDatabase()

    const app = createApp()
    const router = createRouter()

    router.get('/api/items', defineEventHandler(async () => {
      const { rows: active } = await db.execute('SELECT * FROM items WHERE checked = 0 ORDER BY "order"')
      const { rows: completed } = await db.execute('SELECT * FROM items WHERE checked = 1 ORDER BY checked_at DESC')
      return { active, completed }
    }))

    router.post('/api/items', defineEventHandler(async (event) => {
      const body = await readBody(event)
      if (!body || typeof body.text !== 'string' || body.text.trim() === '') {
        throw createError({ statusCode: 400, statusMessage: 'text is required' })
      }
      const { rows } = await db.execute(
        'SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM items WHERE checked = 0'
      )
      const nextOrder = Number(rows[0].next_order)
      const result = await db.execute({
        sql: 'INSERT INTO items (text, "order") VALUES (?, ?)',
        args: [body.text.trim(), nextOrder],
      })
      const id = Number(result.lastInsertRowid)
      return { id, text: body.text.trim(), checked: 0, checked_at: null, order: nextOrder }
    }))

    router.patch('/api/items/:id', defineEventHandler(async (event) => {
      const id = Number(getRouterParam(event, 'id'))
      if (!Number.isFinite(id)) {
        throw createError({ statusCode: 400, statusMessage: 'invalid id' })
      }
      const body = await readBody(event)
      const { rows } = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] })
      if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'not found' })
      }
      if (body && typeof body.text === 'string') {
        const trimmed = body.text.trim()
        if (trimmed.length === 0) {
          throw createError({ statusCode: 400, statusMessage: 'text is required' })
        }
        await db.execute({
          sql: 'UPDATE items SET text = ? WHERE id = ?',
          args: [trimmed, id],
        })
        return { ...rows[0] as any, text: trimmed }
      }
      const item = rows[0] as unknown as { id: number; text: string; checked: number; order: number }
      const newChecked = item.checked ? 0 : 1
      const now = Date.now()
      const checkedAt = newChecked ? now : null
      await db.execute({
        sql: 'UPDATE items SET checked = ?, checked_at = ? WHERE id = ?',
        args: [newChecked, checkedAt, id],
      })
      return { id, text: item.text, checked: newChecked, checked_at: checkedAt, order: item.order }
    }))

    router.patch('/api/items/reorder', defineEventHandler(async (event) => {
      const body = await readBody(event)
      if (!body || !Array.isArray(body.items)) {
        throw createError({ statusCode: 400, statusMessage: 'items array is required' })
      }
      for (const { id, order } of body.items) {
        if (!Number.isFinite(id) || !Number.isFinite(order)) {
          throw createError({ statusCode: 400, statusMessage: 'each item must have id and order' })
        }
        await db.execute({
          sql: 'UPDATE items SET "order" = ? WHERE id = ? AND checked = 0',
          args: [order, id],
        })
      }
      return { success: true }
    }))

    app.use(router)
    server = createServer(toNodeListener(app))
    server.listen(0)
    await once(server, 'listening')
    const address = server.address()
    if (address && typeof address === 'object') {
      url = `http://localhost:${address.port}`
    }
  })

  beforeEach(async () => {
    await db.execute('DELETE FROM items')
  })

  afterAll(() => {
    server?.close()
    db?.close()
  })

  it('returns empty active and completed lists via HTTP', async () => {
    const res = await fetch(`${url}/api/items`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ active: [], completed: [] })
  })

  it('creates an item and returns it in the active list', async () => {
    const createRes = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Køb mælk' }),
    })
    expect(createRes.status).toBe(200)
    const created = await createRes.json()
    expect(created).toMatchObject({ text: 'Køb mælk', checked: 0, order: 0 })
    expect(created.id).toBeTypeOf('number')

    const getRes = await fetch(`${url}/api/items`)
    const body = await getRes.json()
    expect(body.active).toHaveLength(1)
    expect(body.active[0]).toMatchObject({ text: 'Køb mælk', checked: 0 })
    expect(body.completed).toEqual([])
  })

  it('creates items at the bottom of the active list with sequential order', async () => {
    await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'First' }),
    })
    await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Second' }),
    })
    await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Third' }),
    })

    const getRes = await fetch(`${url}/api/items`)
    const body = await getRes.json()
    expect(body.active).toHaveLength(3)
    expect(body.active.map((i: any) => i.text)).toEqual(['First', 'Second', 'Third'])
    expect(body.active.map((i: any) => i.order)).toEqual([0, 1, 2])
  })

  it('rejects empty text with 400', async () => {
    const res = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects missing text with 400', async () => {
    const res = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('checks an active item via PATCH and moves it to completed', async () => {
    const createRes = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Gør noget' }),
    })
    const created = await createRes.json()

    const patchRes = await fetch(`${url}/api/items/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(patchRes.status).toBe(200)
    const patched = await patchRes.json()
    expect(patched.checked).toBe(1)
    expect(patched.checked_at).toBeTypeOf('number')
    expect(patched.order).toBe(created.order)

    const getRes = await fetch(`${url}/api/items`)
    const body = await getRes.json()
    expect(body.active).toHaveLength(0)
    expect(body.completed).toHaveLength(1)
    expect(body.completed[0].id).toBe(created.id)
  })

  it('unchecks a completed item via PATCH and restores it to active', async () => {
    const createRes = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Gør noget' }),
    })
    const created = await createRes.json()

    await fetch(`${url}/api/items/${created.id}`, { method: 'PATCH' })
    const uncheckRes = await fetch(`${url}/api/items/${created.id}`, { method: 'PATCH' })
    expect(uncheckRes.status).toBe(200)
    const unchecked = await uncheckRes.json()
    expect(unchecked.checked).toBe(0)
    expect(unchecked.checked_at).toBeNull()
    expect(unchecked.order).toBe(created.order)

    const getRes = await fetch(`${url}/api/items`)
    const body = await getRes.json()
    expect(body.active).toHaveLength(1)
    expect(body.active[0].id).toBe(created.id)
    expect(body.completed).toEqual([])
  })

  it('orders completed items by checked_at DESC', async () => {
    const r1 = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'First' }),
    })
    const first = await r1.json()

    const r2 = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Second' }),
    })
    const second = await r2.json()

    await fetch(`${url}/api/items/${second.id}`, { method: 'PATCH' })
    await new Promise(r => setTimeout(r, 10))
    await fetch(`${url}/api/items/${first.id}`, { method: 'PATCH' })

    const getRes = await fetch(`${url}/api/items`)
    const body = await getRes.json()
    expect(body.completed.map((i: any) => i.text)).toEqual(['First', 'Second'])
    expect(body.completed[0].checked_at).toBeGreaterThan(body.completed[1].checked_at)
  })

  it('returns 404 when patching a non-existent item', async () => {
    const res = await fetch(`${url}/api/items/99999`, { method: 'PATCH' })
    expect(res.status).toBe(404)
  })

  it('updates item text via PATCH', async () => {
    const createRes = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Køb mælk' }),
    })
    const created = await createRes.json()

    const patchRes = await fetch(`${url}/api/items/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Køb smør' }),
    })
    expect(patchRes.status).toBe(200)
    const updated = await patchRes.json()
    expect(updated.id).toBe(created.id)
    expect(updated.text).toBe('Køb smør')
  })

  it('reorders items via PATCH /api/items/reorder', async () => {
    const r1 = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'A' }),
    })
    const a = await r1.json()

    const r2 = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'B' }),
    })
    const b = await r2.json()

    const r3 = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'C' }),
    })
    const c = await r3.json()

    const reorderRes = await fetch(`${url}/api/items/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: a.id, order: 2 }, { id: b.id, order: 1 }, { id: c.id, order: 0 }] }),
    })
    expect(reorderRes.status).toBe(200)

    const getRes = await fetch(`${url}/api/items`)
    const body = await getRes.json()
    expect(body.active.map((i: any) => i.text)).toEqual(['C', 'B', 'A'])
    expect(body.active.map((i: any) => i.order)).toEqual([0, 1, 2])
  })

  it('rejects reorder with missing items array', async () => {
    const res = await fetch(`${url}/api/items/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('rejects empty text update with 400', async () => {
    const createRes = await fetch(`${url}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Køb mælk' }),
    })
    const created = await createRes.json()

    const res = await fetch(`${url}/api/items/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    })
    expect(res.status).toBe(400)
  })
})
