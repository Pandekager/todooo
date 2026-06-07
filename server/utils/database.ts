import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

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
    _client = createClient({
      url: `file:${process.env.NUXT_DATABASE_PATH || './data/todooo.db'}`,
    })
    await _client.execute(SCHEMA)
  }
  return _client
}

export async function createTestDatabase(): Promise<Client> {
  const client = createClient({ url: ':memory:' })
  await client.execute(SCHEMA)
  return client
}

export function resetDatabase(): void {
  if (_client) {
    _client.close()
    _client = null
  }
}
