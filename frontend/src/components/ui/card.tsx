import type { HTMLAttributes } from 'react'

type DivProps = HTMLAttributes<HTMLDivElement>

function join(className?: string, base?: string) {
  return [base, className].filter(Boolean).join(' ')
}

export function Card({ className, ...props }: DivProps) {
  return <div className={join(className, 'ui-card')} {...props} />
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={join(className, 'ui-card-header')} {...props} />
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={join(className, 'ui-card-content')} {...props} />
}
