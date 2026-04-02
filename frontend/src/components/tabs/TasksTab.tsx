import { CheckSquare, Clock3, Users } from 'lucide-react'
import { TabSection } from './TabSection'

type Member = {
  id: string
  name: string
  initials: string
}

export default function TasksTab({ members }: { members: Member[] }) {
  return (
    <TabSection
      eyebrow="Tasks"
      title="Shared responsibilities live here"
      description="Task creation and assignment logic will connect here next. For now, this section shows the structure the trip page needs."
    >
      <div className="trip-placeholder-grid">
        <article className="trip-placeholder-card">
          <CheckSquare size={18} />
          <h3>Planning checklist</h3>
          <p>Track bookings, packing reminders, and prep work without losing ownership.</p>
        </article>
        <article className="trip-placeholder-card">
          <Users size={18} />
          <h3>Assignees</h3>
          <p>{members.length} potential assignees are available once task assignment is wired up.</p>
        </article>
        <article className="trip-placeholder-card">
          <Clock3 size={18} />
          <h3>Deadlines</h3>
          <p>Due dates and completion state can be layered in without changing this layout.</p>
        </article>
      </div>
    </TabSection>
  )
}
