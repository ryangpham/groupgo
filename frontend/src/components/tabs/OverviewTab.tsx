import { CalendarDays, MapPinned, PlaneTakeoff, Users } from 'lucide-react'
import type { Trip } from '../../types/trip'
import { TabSection } from './TabSection'

type Member = {
  id: string
  name: string
  initials: string
}

export default function OverviewTab({ trip, members }: { trip: Trip; members: Member[] }) {
  return (
    <TabSection
      eyebrow="Overview"
      title="A quick pulse on this trip"
      description="This is the high-level snapshot for the trip. Detailed editing and live planning tools can plug into these sections next."
    >
      <div className="trip-overview-grid">
        <article className="trip-overview-card">
          <MapPinned size={18} />
          <h3>Destination</h3>
          <p>{trip.destination || 'Destination to be finalized with the group.'}</p>
        </article>
        <article className="trip-overview-card">
          <CalendarDays size={18} />
          <h3>Timing</h3>
          <p>{trip.startDate && trip.endDate ? `${trip.startDate} to ${trip.endDate}` : 'Dates still need to be confirmed.'}</p>
        </article>
        <article className="trip-overview-card">
          <Users size={18} />
          <h3>Travelers</h3>
          <p>{members.length} people are currently attached to this trip workspace.</p>
        </article>
        <article className="trip-overview-card">
          <PlaneTakeoff size={18} />
          <h3>Status</h3>
          <p>The shared itinerary workspace is ready for tasks, places, reservations, and expenses.</p>
        </article>
      </div>
    </TabSection>
  )
}
