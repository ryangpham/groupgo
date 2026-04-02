import { useEffect, useState } from 'react'
import { Calendar, Hotel, Pencil, Plus, Ticket, UtensilsCrossed } from 'lucide-react'
import { AddReservationModal, type ReservationFormData } from '../AddReservationModal'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, createReservation, deleteReservation, getTripReservations, updateReservation } from '../../lib/api'

type ReservationItem = {
  id: string
  type: string
  placeName: string
  date: string
  confirmationNumber: string
}

export default function ReservationsTab({ tripId }: { tripId: string }) {
  const { token } = useAuth()
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null)
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError('')

    getTripReservations(token, tripId)
      .then((reservationRows) => {
        if (cancelled) {
          return
        }

        setReservations(
          reservationRows.map((reservationRow) => ({
            id: String(reservationRow.reservation_id),
            type:
              typeof reservationRow.reservation_type === 'string' && reservationRow.reservation_type.trim()
                ? String(reservationRow.reservation_type)
                : 'Reservation',
            placeName:
              typeof reservationRow.place_name === 'string' && reservationRow.place_name.trim()
                ? String(reservationRow.place_name)
                : reservationRow.provider
                  ? String(reservationRow.provider)
                  : 'Untitled reservation',
            date: typeof reservationRow.reservation_date === 'string' ? reservationRow.reservation_date : '',
            confirmationNumber: reservationRow.confirmation_no ? String(reservationRow.confirmation_no) : 'Pending',
          })),
        )
      })
      .catch((apiError) => {
        if (!cancelled) {
          setError(apiError instanceof ApiError ? apiError.message : 'Unable to load reservations')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, tripId])

  const closeModal = () => {
    setSelectedReservation(null)
    setIsReservationModalOpen(false)
  }

  const openCreateModal = () => {
    setSelectedReservation(null)
    setIsReservationModalOpen(true)
  }

  const openEditModal = (reservation: ReservationItem) => {
    setSelectedReservation(reservation)
    setIsReservationModalOpen(true)
  }

  const handleSubmitReservation = async (reservationData: ReservationFormData) => {
    if (!token) {
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      if (selectedReservation) {
        const updatedReservation = await updateReservation(token, selectedReservation.id, {
          trip_id: Number(tripId),
          provider: reservationData.placeName,
          place_name: reservationData.placeName,
          reservation_type: reservationData.type,
          reservation_date: reservationData.date || null,
          confirmation_no: reservationData.confirmationNumber,
          place_id: null,
        })

        setReservations((current) =>
          current.map((reservation) =>
            reservation.id === selectedReservation.id
              ? {
                  id: reservation.id,
                  type:
                    typeof updatedReservation.reservation_type === 'string' && updatedReservation.reservation_type.trim()
                      ? String(updatedReservation.reservation_type)
                      : reservationData.type,
                  placeName:
                    typeof updatedReservation.place_name === 'string' && updatedReservation.place_name.trim()
                      ? String(updatedReservation.place_name)
                      : reservationData.placeName,
                  date:
                    typeof updatedReservation.reservation_date === 'string'
                      ? updatedReservation.reservation_date
                      : reservationData.date,
                  confirmationNumber:
                    typeof updatedReservation.confirmation_no === 'string' && updatedReservation.confirmation_no.trim()
                      ? String(updatedReservation.confirmation_no)
                      : reservationData.confirmationNumber,
                }
              : reservation,
          ),
        )
      } else {
        const createdReservation = await createReservation(token, {
          trip_id: Number(tripId),
          provider: reservationData.placeName,
          place_name: reservationData.placeName,
          reservation_type: reservationData.type,
          reservation_date: reservationData.date || null,
          confirmation_no: reservationData.confirmationNumber,
          place_id: null,
        })

        setReservations((current) => [
          ...current,
          {
            id: String(createdReservation.reservation_id),
            type:
              typeof createdReservation.reservation_type === 'string' && createdReservation.reservation_type.trim()
                ? String(createdReservation.reservation_type)
                : reservationData.type,
            placeName:
              typeof createdReservation.place_name === 'string' && createdReservation.place_name.trim()
                ? String(createdReservation.place_name)
                : reservationData.placeName,
            date: typeof createdReservation.reservation_date === 'string' ? createdReservation.reservation_date : reservationData.date,
            confirmationNumber:
              typeof createdReservation.confirmation_no === 'string' && createdReservation.confirmation_no.trim()
                ? String(createdReservation.confirmation_no)
                : reservationData.confirmationNumber,
          },
        ])
      }

      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to save reservation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCurrentReservation = async () => {
    if (!token || !selectedReservation) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      await deleteReservation(token, selectedReservation.id)
      setReservations((current) => current.filter((reservation) => reservation.id !== selectedReservation.id))
      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to delete reservation')
    } finally {
      setIsDeleting(false)
    }
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

    if (Number.isNaN(date.getTime())) {
      return 'Date not stored yet'
    }

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
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          <span>Add Reservation</span>
        </Button>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      {isLoading ? (
        <div className="reservation-empty-state">
          <Calendar size={40} />
          <p>Loading reservations...</p>
        </div>
      ) : reservations.length > 0 ? (
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
                      <button type="button" className="inline-edit-button" onClick={() => openEditModal(reservation)}>
                        <Pencil size={15} />
                        <span>Edit</span>
                      </button>
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
        key={selectedReservation ? `edit-${selectedReservation.id}` : 'create-reservation'}
        open={isReservationModalOpen}
        onClose={closeModal}
        onSubmitReservation={handleSubmitReservation}
        initialValues={
          selectedReservation
            ? {
                type: selectedReservation.type,
                placeName: selectedReservation.placeName,
                date: selectedReservation.date,
                confirmationNumber: selectedReservation.confirmationNumber,
              }
            : undefined
        }
        mode={selectedReservation ? 'edit' : 'create'}
        onDeleteReservation={selectedReservation ? handleDeleteCurrentReservation : undefined}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
      />
    </section>
  )
}
