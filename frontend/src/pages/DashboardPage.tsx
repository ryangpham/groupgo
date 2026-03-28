import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <p className="dashboard-kicker">You're in</p>
        <h1>Dashboard placeholder</h1>
        <p>
          Auth flow routing is wired up. This page can now be connected to real session
          state and trip data.
        </p>
        <Link className="dashboard-link" to="/">
          Back to login
        </Link>
      </section>
    </main>
  )
}
