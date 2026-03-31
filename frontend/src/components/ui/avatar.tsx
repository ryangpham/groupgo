import type { HTMLAttributes } from 'react'

type AvatarProps = HTMLAttributes<HTMLDivElement>

function join(className?: string, base?: string) {
  return [base, className].filter(Boolean).join(' ')
}

export function Avatar({ className, ...props }: AvatarProps) {
  return <div className={join(className, 'ui-avatar')} {...props} />
}

export function AvatarFallback({ className, ...props }: AvatarProps) {
  return <div className={join(className, 'ui-avatar-fallback')} {...props} />
}
