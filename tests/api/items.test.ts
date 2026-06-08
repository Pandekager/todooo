import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { Client } from '@libsql/client'
import { createApp, createRouter, toNodeListener, defineEventHandler, readBody, createError } from 'h3'
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
})
