import { getDatabase } from '../utils/database'

export default defineEventHandler(async () => {
  const db = getDatabase()
  const active = db.prepare('SELECT * FROM items WHERE checked = 0 ORDER BY "order"').all()
  const completed = db.prepare('SELECT * FROM items WHERE checked = 1 ORDER BY checked_at DESC').all()
  return { active, completed }
})
