export interface OverlaySelection {
  client: 'react' | 'vanilla'
  ui: 'tailwind' | 'none'
  shadcn: boolean
  gsquery: boolean
  gwsEmul: boolean
}

export function overlayList(options: OverlaySelection): string[] {
  const overlays = ['base', `client-${options.client}`]
  if (options.ui === 'tailwind') overlays.push('tailwind')
  if (options.shadcn) overlays.push('shadcn')
  if (options.gsquery) overlays.push('gsquery', `${options.client}-gsquery`)
  if (options.gwsEmul) overlays.push('gws-emul')
  return overlays
}
