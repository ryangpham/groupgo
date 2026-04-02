import { useState } from 'react'
import { Calendar, Hotel, Plus, Ticket, UtensilsCrossed } from 'lucide-react'
import { AddReservationModal } from '../AddReservationModal'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

export default function ReservationsTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [reservations, setReservations] = useState([
    {
      id: '1',
      type: 'Hotel',
      placeName: 'Alila Villas Uluwatu',
      date: '2026-07-15',
      confirmationNumber: 'ALV-2026-789456',
    },
    {
      id: '2',
      type: 'Restaurant',
      placeName: 'Locavore Restaurant',
      date: '2026-07-17',
      confirmationNumber: 'LR-456789',
    },
    {
      id: '3',
      type: 'Activity',
      placeName: 'Sunrise Volcano Trekking',
      date: '2026-07-19',
      confirmationNumber: 'SVT-123456',
    },
  ])

  const handleAddReservation = (reservationData: {
    type: string
    placeName: string
    date: string
    confirmationNumber: string
  }) => {
    setReservations((current) => [...current, { ...reservationData, id: String(current.length + 1) }])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Hotel':
        return Hotel
      case 'Restaurant':
        return UtensilsCrossed
      case 'Activity':
        return Ticket
      default:
        return Ticket
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Reservations</p>
          <h2>Manage your bookings and confirmations</h2>
          <p>Keep lodging, dining, and activity confirmations in one trip-ready view.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add Reservation</span>
        </Button>
      </div>

      {reservations.length > 0 ? (
        <div className="reservation-list-shell">
          {reservations.map((reservation) => {
            const Icon = getIcon(reservation.type)

            return (
              <Card key={reservation.id} className="reservation-card">
                <CardContent className="reservation-card-content">
                  <div className="reservation-icon-wrap">
                    <Icon size={22} />
                  </div>

                  <div className="reservation-copy">
                    <div className="reservation-top-row">
                      <div>
                        <span className="reservation-type-pill">{reservation.type}</span>
                        <h3>{reservation.placeName}</h3>
                      </div>
                    </div>

                    <div className="reservation-meta-grid">
                      <div className="reservation-meta-item">
                        <Calendar size={15} />
                        <span>{formatDate(reservation.date)}</span>
                      </div>
                      <div>
                        <p className="reservation-meta-label">Confirmation #</p>
                        <p className="reservation-meta-value">{reservation.confirmationNumber}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="reservation-empty-state">
          <Ticket size={40} />
          <p>No reservations yet. Add your first reservation to get started.</p>
        </div>
      )}

      <AddReservationModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddReservation={handleAddReservation}
      />
    </section>
  )
}
