import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Database } from 'bun:sqlite'
import { createApp, createRouter, toNodeListener, defineEventHandler } from 'h3'
import { createServer, AddressInfo } from 'node:http'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    checked_at INTEGER,
    "order" INTEGER NOT NULL
  )
`

describe('database layer', () => {
  it('initializes items table and returns empty lists', () => {
    const db = new Database(':memory:')
    db.run(SCHEMA)

    const active = db.prepare('SELECT * FROM items WHERE checked = 0 ORDER BY "order"').all()
    const completed = db.prepare('SELECT * FROM items WHERE checked = 1 ORDER BY checked_at DESC').all()

    expect(active).toEqual([])
    expect(completed).toEqual([])

    db.close()
  })
})

describe('GET /api/items integration', () => {
  let db: Database
  let server: ReturnType<typeof createServer>
  let url: string

  beforeAll(() => {
    db = new Database(':memory:')
    db.run(SCHEMA)

    const app = createApp()
    const router = createRouter()

    router.get('/api/items', defineEventHandler(async () => {
      const active = db.prepare('SELECT * FROM items WHERE checked = 0 ORDER BY "order"').all()
      const completed = db.prepare('SELECT * FROM items WHERE checked = 1 ORDER BY checked_at DESC').all()
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
