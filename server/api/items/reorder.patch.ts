import { getDatabase } from '../../utils/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body || !Array.isArray(body.items)) {
    throw createError({ statusCode: 400, statusMessage: 'items array is required' })
  }
  const db = await getDatabase()
  for (const { id, order } of body.items) {
    if (!Number.isFinite(id) || !Number.isFinite(order)) {
      throw createError({ statusCode: 400, statusMessage: 'each item must have id and order' })
    }
    await db.execute({
      sql: 'UPDATE items SET "order" = ? WHERE id = ? AND checked = 0',
      args: [order, id],
    })
  }
  return { success: true }
})
