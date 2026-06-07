import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Client } from '@libsql/client'
import { createApp, createRouter, toNodeListener, defineEventHandler } from 'h3'
import { createServer } from 'node:http'
import { AddressInfo } from 'node:net'
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

describe('GET /api/items integration', () => {
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

    app.use(router)
    server = createServer(toNodeListener(app))

    return new Promise<void>((resolve) => {
      server.listen(0, () => {
        const { port } = server.address() as AddressInfo
        url = `http://localhost:${port}`
        resolve()
      })
    })
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
})
