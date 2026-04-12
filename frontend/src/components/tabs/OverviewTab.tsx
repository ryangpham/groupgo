import { Calendar, CheckSquare, DollarSign, PinIcon } from 'lucide-react'
import type { Trip } from '../../types/trip'
import { Card, CardContent } from '../ui/card'


type Member = {
  id: string
  name: string
  initials: string
}

export default function OverviewTab({ trip, members, overview,}: {
  trip: Trip
  members: Member[]
  overview: {
    totalExpenses: number
    tasksRemaining: number
    totalTasks: number
    upcomingReservations: number
  }
  }) {
  const summaryData = [
    {
      title: 'Total Expenses',
      value: `$${overview.totalExpenses.toLocaleString()}`,
      icon: DollarSign,
      description: 'Across all members',
    },
    {
      title: 'Tasks Remaining',
      value: String(overview.tasksRemaining),
      icon: CheckSquare,
      description: `Out of ${overview.totalTasks} total tasks`,
    },
    {
      title: 'Upcoming Reservations',
      value: String(overview.upcomingReservations),
      icon: Calendar,
      description: 'Hotels, restaurants, and activities',
    },
  ]

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Overview</p>
          <h2>Trip Overview</h2>
          <p>
            Quick summary of your trip details for {trip.name} with {members.length} travelers currently in the workspace.
          </p>
        </div>
      </div>

      <div className="overview-stats-grid">
        {summaryData.map((item) => (
          <Card key={item.title} className="overview-stat-card">
            <CardContent className="overview-stat-content">
              <div className="overview-stat-icon">
                <item.icon size={22} />
              </div>
              <div>
                <p className="overview-stat-label">{item.title}</p>
                <p className="overview-stat-value">{item.value}</p>
                <p className="overview-stat-description">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
