import { getDatabase } from '../../utils/database'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const body = await readBody(event)

  const db = await getDatabase()
  const { rows } = await db.execute({
    sql: 'SELECT * FROM items WHERE id = ?',
    args: [id],
  })

  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  if (body && typeof body.text === 'string') {
    const trimmed = body.text.trim()
    if (trimmed.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'text is required' })
    }
    await db.execute({
      sql: 'UPDATE items SET text = ? WHERE id = ?',
      args: [trimmed, id],
    })
    const row = rows[0] as unknown as { id: number; text: string; checked: number; checked_at: number | null; order: number }
    return { ...row, text: trimmed }
  }

  const item = rows[0] as unknown as { id: number; text: string; checked: number; order: number }
  const newChecked = item.checked ? 0 : 1
  const now = Date.now()
  const checkedAt = newChecked ? now : null

  await db.execute({
    sql: 'UPDATE items SET checked = ?, checked_at = ? WHERE id = ?',
    args: [newChecked, checkedAt, id],
  })

  return { id, text: item.text, checked: newChecked, checked_at: checkedAt, order: item.order }
})
