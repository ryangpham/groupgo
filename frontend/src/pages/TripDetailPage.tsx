import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, UserPlus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { InviteMemberModal } from '../components/InviteMemberModal'
import OverviewTab from '../components/tabs/OverviewTab'
import PlacesTab from '../components/tabs/PlacesTab'
import ReservationsTab from '../components/tabs/ReservationsTab'
import TasksTab from '../components/tabs/TasksTab'
import ExpensesTab from '../components/tabs/ExpensesTab'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../hooks/useAuth'
import { ApiError, getTrip } from '../lib/api'
import type { Trip } from '../types/trip'

type Member = {
  id: string
  name: string
  initials: string
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'YO'
}

export function TripDetailPage() {
  const navigate = useNavigate()
  const { tripId } = useParams()
  const { token, user } = useAuth()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [invitedMembers, setInvitedMembers] = useState<Member[]>([
    { id: '2', name: 'Jane Smith', initials: 'JS' },
    { id: '3', name: 'Mike Johnson', initials: 'MJ' },
  ])

  const members = useMemo<Member[]>(() => {
    const leadName = user?.display_name ?? 'You'

    return [{ id: '1', name: leadName, initials: getInitials(leadName) }, ...invitedMembers]
  }, [invitedMembers, user?.display_name])

  useEffect(() => {
    if (!tripId || !token) {
      return
    }

    let cancelled = false

    getTrip(token, tripId)
      .then((tripRow) => {
        if (cancelled) {
          return
        }

        setTrip({
          id: String(tripRow.trip_id),
          name: String(tripRow.trip_name),
          destination: '',
          startDate: typeof tripRow.start_date === 'string' ? tripRow.start_date : '',
          endDate: typeof tripRow.end_date === 'string' ? tripRow.end_date : '',
          memberCount: Number(tripRow.member_count ?? 1),
        })
      })
      .catch((apiError) => {
        if (cancelled) {
          return
        }

        setError(apiError instanceof ApiError ? apiError.message : 'Unable to load this trip')
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTrip(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, tripId])

  const displayTrip = useMemo<Trip>(
    () =>
      trip ?? {
        id: tripId ?? 'unknown',
        name: 'Trip workspace',
        destination: '',
        startDate: '',
        endDate: '',
        memberCount: members.length,
      },
    [members.length, trip, tripId],
  )

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Dates to be announced'
    }

    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  }

  const handleInviteMember = (email: string) => {
    const newMember = {
      id: String(invitedMembers.length + 2),
      name: email.split('@')[0],
      initials: email.slice(0, 2).toUpperCase(),
    }

    setInvitedMembers((current) => [...current, newMember])
    setIsInviteModalOpen(false)
  }

  return (
    <div className="trip-workspace-shell">
      <header className="trip-workspace-header">
        <div className="trip-workspace-header-inner">
          <div className="trip-workspace-heading">
            <Button variant="ghost" className="trip-back-button" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={18} />
            </Button>

            <div>
              <p className="dashboard-kicker">Trip workspace</p>
              <h1>{displayTrip.name}</h1>
              <p className="trip-workspace-date">
                <CalendarDays size={16} />
                <span>{formatDateRange(displayTrip.startDate, displayTrip.endDate)}</span>
              </p>
            </div>
          </div>

          <div className="trip-workspace-actions">
            <div className="trip-member-stack" aria-label="Trip members">
              {members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="trip-member-avatar">
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 ? (
                <Avatar className="trip-member-avatar trip-member-overflow">
                  <AvatarFallback>+{members.length - 4}</AvatarFallback>
                </Avatar>
              ) : null}
            </div>

            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus size={16} />
              <span>Invite</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="trip-workspace-main">
        {error ? <p className="form-message form-message-error trip-workspace-message">{error}</p> : null}

        {isLoadingTrip ? (
          <section className="trip-workspace-hero">
            <p className="dashboard-kicker">Loading</p>
            <h2>Building your trip view.</h2>
            <p>Fetching the trip shell and preparing the workspace tabs.</p>
          </section>
        ) : (
          <>
            <section className="trip-workspace-hero">
              <div>
                <p className="dashboard-kicker">Trip details</p>
                <h2>{displayTrip.destination || 'Destination planning starts here.'}</h2>
                <p>
                  Use this workspace to collect the high-level shape of the trip before wiring up deeper planning tools.
                </p>
              </div>
              <div className="trip-detail-chip">{Math.max(displayTrip.memberCount, members.length)} travelers connected</div>
            </section>

            <section className="trip-tabs-shell">
              <Tabs defaultValue="overview" className="trip-tabs">
                <TabsList className="trip-tabs-list">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="places">Places</TabsTrigger>
                  <TabsTrigger value="reservations">Reservations</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab trip={displayTrip} members={members} />
                </TabsContent>
                <TabsContent value="tasks">
                  <TasksTab members={members} />
                </TabsContent>
                <TabsContent value="places">
                  <PlacesTab />
                </TabsContent>
                <TabsContent value="reservations">
                  <ReservationsTab />
                </TabsContent>
                <TabsContent value="expenses">
                  <ExpensesTab members={members} />
                </TabsContent>
              </Tabs>
            </section>
          </>
        )}
      </main>

      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />
    </div>
  )
}
