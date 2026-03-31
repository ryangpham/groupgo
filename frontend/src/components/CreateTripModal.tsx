import { useEffect, useState } from 'react'
import { CalendarPlus, MapPinned, PlaneTakeoff } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import type { CreateTripInput } from '../types/trip'

type CreateTripModalProps = {
  onClose: () => void
  onCreateTrip: (trip: CreateTripInput) => void
  isSubmitting?: boolean
}

const initialState: CreateTripInput = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
}

export function CreateTripModal({ onClose, onCreateTrip, isSubmitting = false }: CreateTripModalProps) {
  const [formData, setFormData] = useState<CreateTripInput>(initialState)

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreateTrip(formData)
  }

  function updateField<Key extends keyof CreateTripInput>(key: Key, value: CreateTripInput[Key]) {
    setFormData((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <Card className="modal-card" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="modal-header">
          <div className="modal-kicker">
            <PlaneTakeoff size={16} />
            <span>Start a new plan</span>
          </div>
          <h2>Create a trip</h2>
          <p className="form-copy">Set the basics now and fill in the details with your group later.</p>
        </CardHeader>

        <CardContent>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <Label htmlFor="trip-name">Trip name</Label>
              <div className="input-icon-wrap">
                <CalendarPlus size={18} />
                <Input
                  id="trip-name"
                  type="text"
                  placeholder="Summer Beach Vacation"
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <Label htmlFor="trip-destination">Destination</Label>
              <div className="input-icon-wrap">
                <MapPinned size={18} />
                <Input
                  id="trip-destination"
                  type="text"
                  placeholder="Optional for now"
                  value={formData.destination}
                  onChange={(event) => updateField('destination', event.target.value)}
                />
              </div>
            </div>

            <div className="date-grid">
              <div className="field-group">
                <Label htmlFor="trip-start-date">Start date</Label>
                <Input
                  id="trip-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => updateField('startDate', event.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <Label htmlFor="trip-end-date">End date</Label>
                <Input
                  id="trip-end-date"
                  type="date"
                  min={formData.startDate || undefined}
                  value={formData.endDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Trip'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
