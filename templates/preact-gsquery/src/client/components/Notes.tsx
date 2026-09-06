import { useEffect, useState } from 'preact/hooks'
import type { JSX } from 'preact'
import { call } from '../api'
import { Button } from '@/components/ui/Button'
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
    <div class="counter">
      <h2>Notes</h2>
      <input
        class="input"
        type="text"
        placeholder="New note"
        value={text}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement>) =>
          setText(e.currentTarget.value)
        }
      />
      <Button onClick={addNote}>Add</Button>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            {note.text} — {new Date(note.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
      {error && <p class="error">{error}</p>}
    </div>
  )
}
