import type { Note } from '../shared/api'
import { getDb } from './db'

function toNote(row: { id: string; text: string; createdAt: Date }): Note {
  return { id: row.id, text: row.text, createdAt: row.createdAt.toISOString() }
}

export const notes = {
  listNotes(): Note[] {
    return getDb()
      .from('Note')
      .query()
      .orderBy('createdAt', 'desc')
      .limit(50)
      .exec()
      .map(toNote)
  },
  addNote(text: string): Note {
    const trimmed = text.trim()
    if (!trimmed) throw new Error('text is required')
    const row = getDb()
      .from('Note')
      .create({ id: Utilities.getUuid(), text: trimmed, createdAt: new Date() })
    return toNote(row)
  },
}
