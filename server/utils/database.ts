import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

let _client: Client | null = null

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    checked_at INTEGER,
    "order" INTEGER NOT NULL
  )
`

export async function getDatabase(): Promise<Client> {
  if (!_client) {
    const dbPath = process.env.NUXT_DATABASE_PATH || './data/todooo.db'
    const dir = dirname(dbPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    _client = createClient({ url: `file:${dbPath}` })
    await _client.execute(SCHEMA)
  }
  return _client
}

export async function createTestDatabase(): Promise<Client> {
  const client = createClient({ url: ':memory:' })
  await client.execute(SCHEMA)
  return client
}
