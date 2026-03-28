import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  eyebrow: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, eyebrow, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-brand-mark" aria-hidden="true">
          <span>G</span>
        </div>
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-copy">{subtitle}</p>
        <div className="auth-hero-card">
          <span>Shared itineraries</span>
          <span>Expense splits</span>
          <span>Live trip updates</span>
        </div>
      </section>

      <section className="auth-panel">{children}</section>
    </main>
  )
}
