import { useMemo, useState } from 'react'
import { Bookmark, MapPin, Plus, Search, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'

type Place = {
  id: string
  name: string
  rating: number
  address: string
  type: string
}

const searchResults: Place[] = [
  {
    id: '3',
    name: 'Tegalalang Rice Terrace',
    rating: 4.6,
    address: 'Tegalalang, Gianyar Regency, Bali',
    type: 'Attraction',
  },
  {
    id: '4',
    name: 'Seminyak Beach',
    rating: 4.4,
    address: 'Seminyak, Kuta, Badung Regency, Bali',
    type: 'Beach',
  },
  {
    id: '5',
    name: 'Waterbom Bali',
    rating: 4.8,
    address: 'Jl. Kartika Plaza, Kuta, Bali',
    type: 'Water Park',
  },
]

export default function PlacesTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([
    {
      id: '1',
      name: 'Ubud Monkey Forest',
      rating: 4.5,
      address: 'Jl. Monkey Forest, Ubud, Bali',
      type: 'Attraction',
    },
    {
      id: '2',
      name: 'Tanah Lot Temple',
      rating: 4.7,
      address: 'Beraban, Kediri, Tabanan Regency, Bali',
      type: 'Temple',
    },
  ])

  const visibleResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }

    return searchResults.filter((place) =>
      `${place.name} ${place.address} ${place.type}`.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [searchQuery])

  const handleSavePlace = (place: Place) => {
    setSavedPlaces((current) => (current.find((savedPlace) => savedPlace.id === place.id) ? current : [...current, place]))
  }

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Places</p>
          <h2>Search and save places to visit</h2>
          <p>Use this local UI to explore possible stops now. Google Places integration can replace the mock results later.</p>
        </div>
      </div>

      <div className="places-search-shell">
        <Search className="places-search-icon" size={18} />
        <Input
          type="text"
          placeholder="Search places..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="places-search-input"
        />
      </div>

      {visibleResults.length > 0 ? (
        <div className="places-section">
          <h3 className="places-section-title">Search Results</h3>
          <div className="places-grid">
            {visibleResults.map((place) => (
              <Card key={place.id} className="place-card">
                <CardContent className="place-card-content">
                  <div className="place-card-top">
                    <h4>{place.name}</h4>
                    <div className="place-rating">
                      <Star size={14} />
                      <span>{place.rating}</span>
                    </div>
                  </div>
                  <div className="place-address">
                    <MapPin size={15} />
                    <p>{place.address}</p>
                  </div>
                  <div className="place-card-footer">
                    <span className="place-type-pill">{place.type}</span>
                    <Button onClick={() => handleSavePlace(place)}>
                      <Plus size={15} />
                      <span>Save</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div className="places-section">
        <div className="places-saved-heading">
          <Bookmark size={18} />
          <h3 className="places-section-title">Saved Places</h3>
        </div>

        {savedPlaces.length > 0 ? (
          <div className="places-grid">
            {savedPlaces.map((place) => (
              <Card key={place.id} className="place-card">
                <CardContent className="place-card-content">
                  <div className="place-card-top">
                    <h4>{place.name}</h4>
                    <div className="place-rating">
                      <Star size={14} />
                      <span>{place.rating}</span>
                    </div>
                  </div>
                  <div className="place-address">
                    <MapPin size={15} />
                    <p>{place.address}</p>
                  </div>
                  <span className="place-type-pill">{place.type}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="reservation-empty-state">
            <Bookmark size={40} />
            <p>No saved places yet. Search above to find places.</p>
          </div>
        )}
      </div>
    </section>
  )
}
