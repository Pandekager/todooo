import { Database } from 'bun:sqlite'

let _db: Database | null = null

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    checked_at INTEGER,
    "order" INTEGER NOT NULL
  )
`

export function getDatabase(): Database {
  if (!_db) {
    _db = new Database(process.env.NUXT_DATABASE_PATH || './data/todooo.db')
    _db.run(SCHEMA)
  }
  return _db
}

export function createTestDatabase(): Database {
  const db = new Database(':memory:')
  db.run(SCHEMA)
  return db
}

export function resetDatabase(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}
