import { getDatabase } from '../../utils/database'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const body = await readBody(event)
  if (!body || typeof body.text !== 'string' || body.text.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'text is required' })
  }

  const db = await getDatabase()
  const { rows } = await db.execute({
    sql: 'SELECT * FROM items WHERE id = ?',
    args: [id],
  })

  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  const trimmed = body.text.trim()
  await db.execute({
    sql: 'UPDATE items SET text = ? WHERE id = ?',
    args: [trimmed, id],
  })

  const row = rows[0] as unknown as { id: number; text: string; checked: number; checked_at: number | null; order: number }
  return { ...row, text: trimmed }
})
