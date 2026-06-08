import { getDatabase } from '../../utils/database'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const db = await getDatabase()
  const { rows } = await db.execute({ sql: 'SELECT * FROM items WHERE id = ?', args: [id] })
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  const item = rows[0] as any
  const newChecked = item.checked ? 0 : 1
  const now = Date.now()

  await db.execute({
    sql: 'UPDATE items SET checked = ?, checked_at = ? WHERE id = ?',
    args: [newChecked, newChecked ? now : null, id],
  })

  return { id, text: item.text, checked: newChecked, checked_at: newChecked ? now : null, order: item.order }
})
