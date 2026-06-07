import { getDatabase } from '../utils/database'

export default defineEventHandler(async () => {
  const db = await getDatabase()
  const { rows: active } = await db.execute('SELECT * FROM items WHERE checked = 0 ORDER BY "order"')
  const { rows: completed } = await db.execute('SELECT * FROM items WHERE checked = 1 ORDER BY checked_at DESC')
  return { active, completed }
})
