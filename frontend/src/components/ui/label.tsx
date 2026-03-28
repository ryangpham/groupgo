import type { LabelHTMLAttributes } from 'react'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className = '', ...props }: LabelProps) {
  const classes = ['ui-label', className].filter(Boolean).join(' ')

  return <label className={classes} {...props} />
}
