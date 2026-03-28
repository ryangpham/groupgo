import { ArrowLeft, Compass } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function TripDetailPage() {
  const { tripId } = useParams()

  return (
    <main className="trip-detail-page">
      <section className="trip-detail-card">
        <p className="dashboard-kicker">Trip workspace</p>
        <h1>Trip {tripId}</h1>
        <p>
          This route is wired up for the dashboard cards. Next step is connecting it to real
          trip data, itinerary details, and collaboration tools.
        </p>
        <div className="trip-detail-actions">
          <Link className="dashboard-link trip-detail-link" to="/dashboard">
            <ArrowLeft size={16} />
            <span>Back to dashboard</span>
          </Link>
          <div className="trip-detail-chip">
            <Compass size={16} />
            <span>Ready for itinerary data</span>
          </div>
        </div>
      </section>
    </main>
  )
}
