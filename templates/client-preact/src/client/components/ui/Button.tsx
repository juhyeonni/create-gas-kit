import type { JSX } from 'preact'

export const Button = (props: JSX.HTMLAttributes<HTMLButtonElement>) => (
  <button type="button" class="button" {...props} />
)
