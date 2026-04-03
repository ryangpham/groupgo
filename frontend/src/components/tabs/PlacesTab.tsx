import { useEffect, useState } from 'react'
import { Bookmark, MapPin, Pencil, Plus, Search, Star } from 'lucide-react'
import { AddPlaceModal, type PlaceFormData } from '../AddPlaceModal'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, createPlace, deletePlace, getTripPlaces, searchTripPlaces, updatePlace } from '../../lib/api'

type Place = {
  id: string
  name: string
  rating: number | null
  address: string
  type: string
}

type SearchPlaceResult = Place & {
  googlePlaceId: string
}

function mapPlaceRow(placeRow: Record<string, unknown>): Place {
  return {
    id: String(placeRow.place_id),
    name: typeof placeRow.place_name === 'string' ? placeRow.place_name : 'Untitled place',
    rating: typeof placeRow.rating === 'number' ? placeRow.rating : placeRow.rating ? Number(placeRow.rating) : null,
    address: typeof placeRow.address === 'string' ? placeRow.address : '',
    type: typeof placeRow.place_type === 'string' ? placeRow.place_type : '',
  }
}

function mapSearchRow(placeRow: Record<string, unknown>): SearchPlaceResult {
  return {
    id: typeof placeRow.google_place_id === 'string' ? placeRow.google_place_id : crypto.randomUUID(),
    googlePlaceId: typeof placeRow.google_place_id === 'string' ? placeRow.google_place_id : '',
    name: typeof placeRow.place_name === 'string' ? placeRow.place_name : 'Untitled place',
    rating: typeof placeRow.rating === 'number' ? placeRow.rating : placeRow.rating ? Number(placeRow.rating) : null,
    address: typeof placeRow.address === 'string' ? placeRow.address : '',
    type: typeof placeRow.place_type === 'string' ? placeRow.place_type : '',
  }
}

function toFormValues(place: Place): PlaceFormData {
  return {
    name: place.name,
    address: place.address,
    rating: place.rating === null ? '' : String(place.rating),
    type: place.type,
  }
}

export default function PlacesTab({ tripId }: { tripId: string }) {
  const { token } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPlaceResult[]>([])
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([])
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError('')

    getTripPlaces(token, tripId)
      .then((placeRows) => {
        if (!cancelled) {
          setSavedPlaces(placeRows.map((placeRow) => mapPlaceRow(placeRow)))
        }
      })
      .catch((apiError) => {
        if (!cancelled) {
          setError(apiError instanceof ApiError ? apiError.message : 'Unable to load saved places')
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

  useEffect(() => {
    if (!token) {
      return
    }

    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    const timeoutId = window.setTimeout(() => {
      searchTripPlaces(token, tripId, query)
        .then((placeRows) => {
          if (!cancelled) {
            setSearchResults(placeRows.map((placeRow) => mapSearchRow(placeRow)))
          }
        })
        .catch((apiError) => {
          if (!cancelled) {
            setSearchResults([])
            setError(apiError instanceof ApiError ? apiError.message : 'Unable to search places')
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false)
          }
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [token, tripId, searchQuery])

  const closeModal = () => {
    setSelectedPlace(null)
    setIsPlaceModalOpen(false)
  }

  const openCreateModal = () => {
    setSelectedPlace(null)
    setIsPlaceModalOpen(true)
  }

  const openEditModal = (place: Place) => {
    setSelectedPlace(place)
    setIsPlaceModalOpen(true)
  }

  const isSavedPlace = (place: Pick<Place, 'name' | 'address'>) =>
    savedPlaces.some(
      (savedPlace) =>
        savedPlace.name.trim().toLowerCase() === place.name.trim().toLowerCase() &&
        savedPlace.address.trim().toLowerCase() === place.address.trim().toLowerCase(),
    )

  const submitPlace = async (placeData: { name: string; address: string; rating: number | null; type: string }) => {
    if (!token) {
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      if (selectedPlace) {
        const updatedPlace = await updatePlace(token, selectedPlace.id, {
          trip_id: Number(tripId),
          place_name: placeData.name,
          address: placeData.address || null,
          rating: placeData.rating,
          place_type: placeData.type || null,
        })

        setSavedPlaces((current) =>
          current.map((place) => (place.id === selectedPlace.id ? mapPlaceRow(updatedPlace) : place)),
        )
      } else {
        const createdPlace = await createPlace(token, {
          trip_id: Number(tripId),
          place_name: placeData.name,
          address: placeData.address || null,
          rating: placeData.rating,
          place_type: placeData.type || null,
        })

        setSavedPlaces((current) => [...current, mapPlaceRow(createdPlace)])
      }

      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to save place')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitPlace = async (placeData: PlaceFormData) => {
    const ratingValue = placeData.rating.trim() ? Number(placeData.rating) : null

    await submitPlace({
      name: placeData.name.trim(),
      address: placeData.address.trim(),
      rating: Number.isFinite(ratingValue) ? ratingValue : null,
      type: placeData.type.trim(),
    })
  }

  const handleSaveSearchResult = async (place: SearchPlaceResult) => {
    if (isSavedPlace(place)) {
      return
    }

    await submitPlace({
      name: place.name,
      address: place.address,
      rating: place.rating,
      type: place.type,
    })
  }

  const handleDeleteCurrentPlace = async () => {
    if (!token || !selectedPlace) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      await deletePlace(token, selectedPlace.id)
      setSavedPlaces((current) => current.filter((place) => place.id !== selectedPlace.id))
      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to delete place')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Places</p>
          <h2>Search and save places to visit</h2>
          <p>Search now uses Google Places, then saves selected results into your trip's own shared place list.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          <span>Add Place</span>
        </Button>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <div className="places-search-shell">
        <Search className="places-search-icon" size={18} />
        <Input
          type="text"
          placeholder="Search Google Places..."
          value={searchQuery}
          onChange={(event) => {
            setError('')
            setSearchQuery(event.target.value)
          }}
          className="places-search-input"
        />
      </div>

      {searchQuery.trim().length >= 2 ? (
        <div className="places-section">
          <h3 className="places-section-title">Search Results</h3>
          {isSearching ? (
            <div className="reservation-empty-state">
              <Search size={40} />
              <p>Searching Google Places...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="places-grid">
              {searchResults.map((place) => {
                const alreadySaved = isSavedPlace(place)

                return (
                  <Card key={place.googlePlaceId || place.id} className="place-card">
                    <CardContent className="place-card-content">
                      <div className="place-card-top">
                        <h4>{place.name}</h4>
                        <div className="place-rating">
                          <Star size={14} />
                          <span>{place.rating ?? 'N/A'}</span>
                        </div>
                      </div>
                      <div className="place-address">
                        <MapPin size={15} />
                        <p>{place.address || 'Address not available'}</p>
                      </div>
                      <div className="place-card-footer">
                        <span className="place-type-pill">{place.type || 'Place'}</span>
                        <Button onClick={() => void handleSaveSearchResult(place)} disabled={alreadySaved || isSubmitting}>
                          <Plus size={15} />
                          <span>{alreadySaved ? 'Saved' : 'Save'}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="reservation-empty-state">
              <Search size={40} />
              <p>No Google Places matches found.</p>
            </div>
          )}
        </div>
      ) : null}

      <div className="places-section">
        <div className="places-saved-heading">
          <Bookmark size={18} />
          <h3 className="places-section-title">Saved Places</h3>
        </div>

        {isLoading ? (
          <div className="reservation-empty-state">
            <Bookmark size={40} />
            <p>Loading saved places...</p>
          </div>
        ) : savedPlaces.length > 0 ? (
          <div className="places-grid">
            {savedPlaces.map((place) => (
              <Card key={place.id} className="place-card">
                <CardContent className="place-card-content">
                  <div className="place-card-top">
                    <h4>{place.name}</h4>
                    <div className="place-rating">
                      <Star size={14} />
                      <span>{place.rating ?? 'N/A'}</span>
                    </div>
                  </div>
                  <div className="place-address">
                    <MapPin size={15} />
                    <p>{place.address || 'Address not stored yet'}</p>
                  </div>
                  <div className="place-card-footer">
                    <span className="place-type-pill">{place.type || 'Place'}</span>
                    <button type="button" className="inline-edit-button" onClick={() => openEditModal(place)}>
                      <Pencil size={15} />
                      <span>Edit</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="reservation-empty-state">
            <Bookmark size={40} />
            <p>No saved places yet. Search above or add one manually to get started.</p>
          </div>
        )}
      </div>

      <AddPlaceModal
        key={selectedPlace ? `edit-${selectedPlace.id}` : 'create-place'}
        open={isPlaceModalOpen}
        onClose={closeModal}
        onSubmitPlace={handleSubmitPlace}
        initialValues={selectedPlace ? toFormValues(selectedPlace) : undefined}
        mode={selectedPlace ? 'edit' : 'create'}
        onDeletePlace={selectedPlace ? handleDeleteCurrentPlace : undefined}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
      />
    </section>
  )
}
