import { SheetsAdapter } from '@gsquery/core'
import { createDB, schema } from './generated'
import type { Note } from './generated'
import { getSpreadsheet } from './spreadsheet'

let db: ReturnType<typeof createDB> | undefined

export function getDb() {
  if (db) return db
  db = createDB({
    Note: new SheetsAdapter<Note>({
      spreadsheetId: getSpreadsheet().getId(),
      sheetName: schema.tables.Note.sheetName,
      columns: [...schema.tables.Note.columns],
      idMode: 'client',
      columnTypes: { createdAt: 'date' },
    }),
  })
  return db
}
