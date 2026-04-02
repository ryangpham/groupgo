import type { InputHTMLAttributes } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function Checkbox({ className = '', ...props }: CheckboxProps) {
  const classes = ['ui-checkbox', className].filter(Boolean).join(' ')

  return <input type="checkbox" className={classes} {...props} />
}
