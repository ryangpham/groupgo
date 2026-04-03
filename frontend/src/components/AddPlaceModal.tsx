import { MapPin, PencilLine, Star, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type PlaceFormData = {
  name: string
  address: string
  rating: string
  type: string
}

type AddPlaceModalProps = {
  open: boolean
  onClose: () => void
  onSubmitPlace: (place: PlaceFormData) => void | Promise<void>
  initialValues?: PlaceFormData
  mode?: 'create' | 'edit'
  onDeletePlace?: () => void | Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
}

const defaultState: PlaceFormData = {
  name: '',
  address: '',
  rating: '',
  type: '',
}

export function AddPlaceModal({
  open,
  onClose,
  onSubmitPlace,
  initialValues,
  mode = 'create',
  onDeletePlace,
  isSubmitting = false,
  isDeleting = false,
}: AddPlaceModalProps) {
  const values = initialValues ?? defaultState
  const [formData, setFormData] = useState<PlaceFormData>(values)

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
            <PencilLine size={16} />
            <span>{mode === 'edit' ? 'Edit saved place' : 'Add a saved place'}</span>
          </div>
          <h2>{mode === 'edit' ? 'Update saved place' : 'Create a saved place'}</h2>
          <p className="form-copy">Store a place on the trip now, then link it from reservations and planning flows.</p>
        </CardHeader>

        <CardContent>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault()
              await onSubmitPlace(formData)
            }}
          >
            <div className="field-group">
              <Label htmlFor="place-name">Place name</Label>
              <div className="input-icon-wrap">
                <MapPin size={18} />
                <Input
                  id="place-name"
                  type="text"
                  placeholder="Ubud Monkey Forest"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  required
                  disabled={isSubmitting || isDeleting}
                />
              </div>
            </div>

            <div className="field-group">
              <Label htmlFor="place-address">Address</Label>
              <div className="input-icon-wrap">
                <MapPin size={18} />
                <Input
                  id="place-address"
                  type="text"
                  placeholder="Jl. Monkey Forest, Ubud, Bali"
                  value={formData.address}
                  onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                  disabled={isSubmitting || isDeleting}
                />
              </div>
            </div>

            <div className="date-grid">
              <div className="field-group">
                <Label htmlFor="place-rating">Rating</Label>
                <div className="input-icon-wrap">
                  <Star size={18} />
                  <Input
                    id="place-rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="4.6"
                    value={formData.rating}
                    onChange={(event) => setFormData((current) => ({ ...current, rating: event.target.value }))}
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>

              <div className="field-group">
                <Label htmlFor="place-type">Type</Label>
                <div className="input-icon-wrap">
                  <Tag size={18} />
                  <Input
                    id="place-type"
                    type="text"
                    placeholder="Attraction"
                    value={formData.type}
                    onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions modal-actions-split">
              {mode === 'edit' && onDeletePlace ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="ui-button-danger"
                  onClick={async () => await onDeletePlace()}
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
                  {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Adding...') : mode === 'edit' ? 'Save Changes' : 'Add Place'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
