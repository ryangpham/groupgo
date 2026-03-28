import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, LogOut, MapPin, Plus, Users } from 'lucide-react'
import { CreateTripModal } from '../components/CreateTripModal'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import type { CreateTripInput, Trip } from '../types/trip'

export function DashboardPage() {
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: '1',
      name: 'Summer Beach Vacation',
      destination: 'Bali, Indonesia',
      startDate: '2026-07-15',
      endDate: '2026-07-22',
      memberCount: 6,
    },
    {
      id: '2',
      name: 'Mountain Hiking Trip',
      destination: 'Swiss Alps, Switzerland',
      startDate: '2026-08-10',
      endDate: '2026-08-17',
      memberCount: 4,
    },
    {
      id: '3',
      name: 'City Break',
      destination: 'Tokyo, Japan',
      startDate: '2026-09-05',
      endDate: '2026-09-12',
      memberCount: 8,
    },
  ])

  const handleCreateTrip = (tripData: CreateTripInput) => {
    const newTrip: Trip = {
      ...tripData,
      id: String(trips.length + 1),
      memberCount: 1,
    }

    setTrips((current) => [newTrip, ...current])
    setIsCreateModalOpen(false)
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div className="auth-brand-mark dashboard-brand-mark" aria-hidden="true">
              <span>G</span>
            </div>
            <div>
              <p className="dashboard-kicker">Trip hub</p>
              <h1>GroupGo</h1>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="avatar-button">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <LogOut size={16} />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="dashboard-page">
        <section className="dashboard-hero-panel">
          <div>
            <p className="dashboard-kicker">Your trips</p>
            <h2>Manage every group adventure in one place.</h2>
            <p>
              Keep dates, destinations, and people aligned without jumping across chats,
              docs, and spreadsheets.
            </p>
          </div>

          <Button className="dashboard-create-button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Create New Trip</span>
          </Button>
        </section>

        {trips.length > 0 ? (
          <section className="trip-grid">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="trip-card"
                onClick={() => navigate(`/trip/${trip.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/trip/${trip.id}`)
                  }
                }}
              >
                <CardContent className="trip-card-content">
                  <div className="trip-card-top">
                    <p className="trip-card-label">Upcoming trip</p>
                    <span className="trip-member-pill">{trip.memberCount} travelers</span>
                  </div>

                  <div className="trip-card-copy">
                    <h3>{trip.name}</h3>
                    <p>{trip.destination}</p>
                  </div>

                  <div className="trip-meta-list">
                    <div className="trip-meta-item">
                      <MapPin size={16} />
                      <span>{trip.destination}</span>
                    </div>
                    <div className="trip-meta-item">
                      <Calendar size={16} />
                      <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                    </div>
                    <div className="trip-meta-item">
                      <Users size={16} />
                      <span>{trip.memberCount} members</span>
                    </div>
                  </div>

                  <Button
                    className="trip-open-button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/trip/${trip.id}`)
                    }}
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : (
          <section className="dashboard-empty-state">
            <p className="dashboard-kicker">No trips yet</p>
            <h2>Your first plan starts here.</h2>
            <p>Create a trip to invite your group and start shaping the itinerary together.</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>Create New Trip</Button>
          </section>
        )}
      </main>

      {isCreateModalOpen ? (
        <CreateTripModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTrip={handleCreateTrip}
        />
      ) : null}
    </div>
  )
}
