import { getDatabase } from '../utils/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body || typeof body.text !== 'string' || body.text.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }
  const db = await getDatabase()
  const resultSet = await db.execute(
    'SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM items WHERE checked = 0'
  )
  const nextOrder = Number(resultSet.rows[0]?.next_order ?? 0)
  const result = await db.execute({
    sql: 'INSERT INTO items (text, "order") VALUES (?, ?)',
    args: [body.text.trim(), nextOrder],
  })
  const id = Number(result.lastInsertRowid)
  return { id, text: body.text.trim(), checked: 0, checked_at: null, order: nextOrder }
})
