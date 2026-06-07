import BetterSqlite3 from 'better-sqlite3'

class Database {
  private db: BetterSqlite3.Database

  constructor(path: string, options?: Record<string, unknown>) {
    this.db = new BetterSqlite3(path, options)
  }

  run(sql: string, ...params: unknown[]) {
    if (params.length > 0) {
      const stmt = this.db.prepare(sql)
      return stmt.run(...params)
    }
    this.db.exec(sql)
  }

  prepare(sql: string) {
    return this.db.prepare(sql)
  }

  close() {
    this.db.close()
  }
}

export { Database }
