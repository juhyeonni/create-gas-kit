export interface Note {
  id: string
  text: string
  createdAt: string
}

export interface Api {
  getCount(): number
  increment(): number
  reset(): number
  listNotes(): Note[]
  addNote(text: string): Note
}

export type Action = keyof Api
