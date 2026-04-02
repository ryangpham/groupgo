import { Building2, ReceiptText, Ticket } from 'lucide-react'
import { TabSection } from './TabSection'

export default function ReservationsTab() {
  return (
    <TabSection
      eyebrow="Reservations"
      title="Keep confirmations in one place"
      description="Reservation CRUD can connect here later. The page structure is ready for providers, confirmation numbers, and booking records."
    >
      <div className="trip-placeholder-grid">
        <article className="trip-placeholder-card">
          <Building2 size={18} />
          <h3>Lodging</h3>
          <p>Store hotel details, check-in notes, and booking contacts.</p>
        </article>
        <article className="trip-placeholder-card">
          <Ticket size={18} />
          <h3>Transit</h3>
          <p>Track airline, train, and tour reservation details in the same place.</p>
        </article>
        <article className="trip-placeholder-card">
          <ReceiptText size={18} />
          <h3>Reference info</h3>
          <p>Confirmation numbers and place links can live here once backend data is connected.</p>
        </article>
      </div>
    </TabSection>
  )
}
