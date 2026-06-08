import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const PORT = 3099
const DB_PATH = resolve('./data/smoke-test.db')
const SERVER_ENTRY = resolve('.output/server/index.mjs')

async function waitFor(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {}
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Server not ready after ${timeoutMs}ms`)
}

function cleanupDb() {
  try { rmSync(DB_PATH) } catch {}
  try { rmSync(DB_PATH + '-wal') } catch {}
  try { rmSync(DB_PATH + '-shm') } catch {}
}

describe('production smoke test', () => {
  let proc: ChildProcess

  beforeAll(async () => {
    if (!process.env.SMOKE) return

    if (!existsSync(SERVER_ENTRY)) {
      throw new Error('No production build found. Run `bun run build` first.')
    }
    cleanupDb()

    proc = spawn('bun', [SERVER_ENTRY], {
      cwd: resolve('.'),
      env: {
        ...process.env,
        NITRO_PORT: String(PORT),
        PORT: String(PORT),
        NUXT_DATABASE_PATH: DB_PATH,
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    })

    await waitFor(`http://localhost:${PORT}/api/items`)
  }, 25000)

  afterAll(() => {
    if (!process.env.SMOKE) return
    proc?.kill('SIGTERM')
    cleanupDb()
  })

  it('GET /api/items returns 200 with empty lists on fresh db', async () => {
    if (!process.env.SMOKE) return
    const res = await fetch(`http://localhost:${PORT}/api/items`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ active: [], completed: [] })
  })

  it('POST creates an item and GET returns it', async () => {
    if (!process.env.SMOKE) return
    const create = await fetch(`http://localhost:${PORT}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Røgtest' }),
    })
    expect(create.status).toBe(200)
    const item = await create.json()
    expect(item.text).toBe('Røgtest')
    expect(item.checked).toBe(0)

    const list = await fetch(`http://localhost:${PORT}/api/items`)
    const body = await list.json()
    expect(body.active).toHaveLength(1)
    expect(body.active[0].text).toBe('Røgtest')
  })

  it('PATCH toggles item from active to completed and back', async () => {
    if (!process.env.SMOKE) return
    const { active: [item] } = await fetch(`http://localhost:${PORT}/api/items`).then(r => r.json())

    // Check it
    const check = await fetch(`http://localhost:${PORT}/api/items/${item.id}`, { method: 'PATCH' })
    expect(check.status).toBe(200)
    const checked = await check.json()
    expect(checked.checked).toBe(1)

    const afterCheck = await fetch(`http://localhost:${PORT}/api/items`).then(r => r.json())
    expect(afterCheck.active).toHaveLength(0)
    expect(afterCheck.completed).toHaveLength(1)
    expect(afterCheck.completed[0].id).toBe(item.id)

    // Uncheck it
    const uncheck = await fetch(`http://localhost:${PORT}/api/items/${item.id}`, { method: 'PATCH' })
    expect(uncheck.status).toBe(200)
    const unchecked = await uncheck.json()
    expect(unchecked.checked).toBe(0)

    const afterUncheck = await fetch(`http://localhost:${PORT}/api/items`).then(r => r.json())
    expect(afterUncheck.active).toHaveLength(1)
    expect(afterUncheck.completed).toHaveLength(0)
  })
})
