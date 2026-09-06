import type { Api, Note } from '../shared/api'

let count = 0
let nextId = 1
const notes: Note[] = []

export const mock: Api = {
  getCount() {
    return count
  },
  increment() {
    count += 1
    return count
  },
  reset() {
    count = 0
    return count
  },
  listNotes() {
    return [...notes]
  },
  addNote(text) {
    const trimmed = text.trim()
    if (!trimmed) throw new Error('text is required')
    const note: Note = {
      id: String(nextId++),
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    notes.unshift(note)
    return note
  },
}
