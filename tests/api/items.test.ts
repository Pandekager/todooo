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
      if (isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'invalid id' })
      }
      const { rows } = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] })
      if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'not found' })
      }
      const item = rows[0] as any
      const newChecked = item.checked ? 0 : 1
      const now = Date.now()
      await db.execute({
        sql: 'UPDATE items SET checked = ?, checked_at = ? WHERE id = ?',
        args: [newChecked, newChecked ? now : null, id],
      })
      return { id, text: item.text, checked: newChecked, checked_at: newChecked ? now : null, order: item.order }
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
})
