import { useState } from 'react'
import { CalendarDays, Hotel, ReceiptText, Ticket, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type ReservationFormData = {
  type: string
  placeName: string
  date: string
  confirmationNumber: string
}

type AddReservationModalProps = {
  open: boolean
  onClose: () => void
  onSubmitReservation: (reservation: ReservationFormData) => void | Promise<void>
  initialValues?: ReservationFormData
  mode?: 'create' | 'edit'
  onDeleteReservation?: () => void | Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
}

const defaultState: ReservationFormData = {
  type: 'Hotel',
  placeName: '',
  date: '',
  confirmationNumber: '',
}

export function AddReservationModal({
  open,
  onClose,
  onSubmitReservation,
  initialValues,
  mode = 'create',
  onDeleteReservation,
  isSubmitting = false,
  isDeleting = false,
}: AddReservationModalProps) {
  const values = initialValues ?? defaultState
  const [formData, setFormData] = useState<ReservationFormData>(values)

  if (!open) {
    return null
  }

  const handleClose = () => {
    setFormData(values)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleClose} role="presentation">
      <Card className="modal-card" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="modal-header">
          <div className="modal-kicker">
            <ReceiptText size={16} />
            <span>{mode === 'edit' ? 'Edit booking' : 'Add a booking'}</span>
          </div>
          <h2>{mode === 'edit' ? 'Update reservation' : 'Create a reservation'}</h2>
          <p className="form-copy">Capture the essential booking details now and expand the record later.</p>
        </CardHeader>

        <CardContent>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault()
              await onSubmitReservation(formData)
            }}
          >
            <div className="field-group">
              <Label htmlFor="reservation-type">Type</Label>
              <div className="input-icon-wrap input-select-wrap">
                <Hotel size={18} />
                <select
                  id="reservation-type"
                  className="ui-select"
                  value={formData.type}
                  onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}
                  disabled={isSubmitting || isDeleting}
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Activity">Activity</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <Label htmlFor="reservation-place">Place name</Label>
              <div className="input-icon-wrap">
                <Ticket size={18} />
                <Input
                  id="reservation-place"
                  type="text"
                  placeholder="Alila Villas Uluwatu"
                  value={formData.placeName}
                  onChange={(event) => setFormData((current) => ({ ...current, placeName: event.target.value }))}
                  required
                  disabled={isSubmitting || isDeleting}
                />
              </div>
            </div>

            <div className="date-grid">
              <div className="field-group">
                <Label htmlFor="reservation-date">Date</Label>
                <div className="input-icon-wrap">
                  <CalendarDays size={18} />
                  <Input
                    id="reservation-date"
                    type="date"
                    value={formData.date}
                    onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))}
                    required
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>

              <div className="field-group">
                <Label htmlFor="reservation-confirmation">Confirmation #</Label>
                <div className="input-icon-wrap">
                  <ReceiptText size={18} />
                  <Input
                    id="reservation-confirmation"
                    type="text"
                    placeholder="ALV-2026-789456"
                    value={formData.confirmationNumber}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, confirmationNumber: event.target.value }))
                    }
                    required
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions modal-actions-split">
              {mode === 'edit' && onDeleteReservation ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="ui-button-danger"
                  onClick={async () => await onDeleteReservation()}
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </Button>
              ) : null}

              <div className="modal-actions-cluster">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting || isDeleting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isDeleting}>
                  {isSubmitting
                    ? mode === 'edit'
                      ? 'Saving...'
                      : 'Adding...'
                    : mode === 'edit'
                      ? 'Save Changes'
                      : 'Add Reservation'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
