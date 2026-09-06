import { useEffect, useState } from 'react'
import { call } from '../api'
import { Button } from '@/components/ui/button'
import type { Note } from '../../shared/api'

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()

  function showError(err: unknown) {
    setError(err instanceof Error ? err.message : String(err))
  }

  function load() {
    call('listNotes').then(setNotes).catch(showError)
  }

  useEffect(load, [])

  async function addNote() {
    try {
      await call('addNote', text)
      setText('')
      load()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <div className="counter">
      <h2>Notes</h2>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={addNote}>Add</Button>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            {note.text} — {new Date(note.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
