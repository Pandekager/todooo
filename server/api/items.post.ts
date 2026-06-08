import { getDatabase } from '../utils/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body || typeof body.text !== 'string' || body.text.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }
  const text = body.text.trim()
  const db = await getDatabase()
  const { rows } = await db.execute(
    'SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM items WHERE checked = 0'
  )
  const nextOrder = Number(rows[0]?.next_order ?? 0)
  const result = await db.execute({
    sql: 'INSERT INTO items (text, "order") VALUES (?, ?)',
    args: [text, nextOrder],
  })
  return { id: Number(result.lastInsertRowid), text, checked: 0, checked_at: null, order: nextOrder }
})
