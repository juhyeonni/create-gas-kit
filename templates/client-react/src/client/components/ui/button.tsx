import type { ComponentProps } from 'react'

export const Button = (props: ComponentProps<'button'>) => (
  <button type="button" className="button" {...props} />
)
