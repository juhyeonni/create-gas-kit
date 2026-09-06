const SPREADSHEET_ID_PROPERTY = 'SPREADSHEET_ID'

export function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const active = SpreadsheetApp.getActiveSpreadsheet()
  if (active) return active

  const id = PropertiesService.getScriptProperties().getProperty(
    SPREADSHEET_ID_PROPERTY,
  )
  if (id) return SpreadsheetApp.openById(id)

  throw new Error(
    `No active spreadsheet and no "${SPREADSHEET_ID_PROPERTY}" script property set`,
  )
}
