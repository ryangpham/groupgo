import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className = '', type = 'button', ...props }: ButtonProps) {
  const classes = ['ui-button', className].filter(Boolean).join(' ')

  return <button type={type} className={classes} {...props} />
}
