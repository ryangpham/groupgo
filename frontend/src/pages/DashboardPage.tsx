import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, LogOut, MapPin, Plus, Users } from 'lucide-react'
import { CreateTripModal } from '../components/CreateTripModal'
import { useAuth } from '../hooks/useAuth'
import { ApiError, createTrip, getUserTrips } from '../lib/api'
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
  const { logout, token, user } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoadingTrips, setIsLoadingTrips] = useState(true)
  const [error, setError] = useState('')
  const [isCreatingTrip, setIsCreatingTrip] = useState(false)

  const userInitials = useMemo(() => {
    if (!user?.display_name) {
      return 'GG'
    }

    return user.display_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  }, [user?.display_name])

  useEffect(() => {
    if (!token || !user) {
      return
    }

    let cancelled = false

    setIsLoadingTrips(true)
    setError('')

    getUserTrips(token, user.user_id)
      .then((tripRows) => {
        if (cancelled) {
          return
        }

        const mappedTrips = tripRows.map((tripRow) => ({
          id: String(tripRow.trip_id),
          name: String(tripRow.trip_name),
          destination: '',
          startDate: typeof tripRow.start_date === 'string' ? tripRow.start_date : '',
          endDate: typeof tripRow.end_date === 'string' ? tripRow.end_date : '',
          memberCount: Number(tripRow.member_count ?? 1),
        }))

        setTrips(mappedTrips)
      })
      .catch((apiError) => {
        if (cancelled) {
          return
        }

        setError(apiError instanceof ApiError ? apiError.message : 'Unable to load your trips')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTrips(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, user])

  const handleCreateTrip = async (tripData: CreateTripInput) => {
    if (!token || !user) {
      return
    }

    try {
      setIsCreatingTrip(true)
      setError('')

      const createdTrip = await createTrip(token, {
        trip_name: tripData.name,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        owner_user_id: user.user_id,
        destination: tripData.destination,
      })

      const newTrip: Trip = {
        id: String(createdTrip.trip_id),
        name: String(createdTrip.trip_name),
        destination: tripData.destination,
        startDate: typeof createdTrip.start_date === 'string' ? createdTrip.start_date : '',
        endDate: typeof createdTrip.end_date === 'string' ? createdTrip.end_date : '',
        memberCount: Number(createdTrip.member_count ?? 1),
      }

      setTrips((current) => [newTrip, ...current])
      setIsCreateModalOpen(false)
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to create trip')
    } finally {
      setIsCreatingTrip(false)
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate && !endDate) {
      return 'Dates to be added'
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Dates to be added'
    }

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const handleLogout = () => {
    logout()
    navigate('/')
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
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
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
              Welcome back, {user?.display_name ?? 'traveler'}. Keep dates, destinations,
              and people aligned without jumping across chats, docs, and spreadsheets.
            </p>
          </div>

          <Button className="dashboard-create-button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Create New Trip</span>
          </Button>
        </section>

        {error ? <p className="form-message form-message-error dashboard-message">{error}</p> : null}

        {isLoadingTrips ? (
          <section className="dashboard-empty-state">
            <p className="dashboard-kicker">Loading</p>
            <h2>Pulling in your trips.</h2>
            <p>We&apos;re fetching the latest plans tied to your account.</p>
          </section>
        ) : trips.length > 0 ? (
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
                    <p>{trip.destination || 'Destination to be added'}</p>
                  </div>

                  <div className="trip-meta-list">
                    <div className="trip-meta-item">
                      <MapPin size={16} />
                      <span>{trip.destination || 'Destination coming soon'}</span>
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
          isSubmitting={isCreatingTrip}
        />
      ) : null}
    </div>
  )
}
