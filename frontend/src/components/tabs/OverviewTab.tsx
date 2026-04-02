import { Calendar, CheckSquare, DollarSign } from 'lucide-react'
import type { Trip } from '../../types/trip'
import { Card, CardContent } from '../ui/card'

type Member = {
  id: string
  name: string
  initials: string
}

export default function OverviewTab({ trip, members }: { trip: Trip; members: Member[] }) {
  const summaryData = [
    {
      title: 'Total Expenses',
      value: '$3,245',
      icon: DollarSign,
      description: 'Across all members',
    },
    {
      title: 'Tasks Remaining',
      value: '7',
      icon: CheckSquare,
      description: 'Out of 12 total tasks',
    },
    {
      title: 'Upcoming Reservations',
      value: '4',
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
