import { useState } from 'react'
import { CalendarDays, CheckSquare, UserRound } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

type Member = {
  id: string
  name: string
  initials: string
}

type AddTaskModalProps = {
  open: boolean
  onClose: () => void
  onAddTask: (taskData: { title: string; dueDate: string; assignedToId: string }) => void
  members: Member[]
}

export function AddTaskModal({ open, onClose, onAddTask, members }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedToId, setAssignedToId] = useState(members[0]?.id ?? '')

  if (!open) {
    return null
  }

  const handleClose = () => {
    setTitle('')
    setDueDate('')
    setAssignedToId(members[0]?.id ?? '')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleClose} role="presentation">
      <Card className="modal-card" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="modal-header">
          <div className="modal-kicker">
            <CheckSquare size={16} />
            <span>Add a task</span>
          </div>
          <h2>Track a new trip task</h2>
          <p className="form-copy">Capture one responsibility, assign it, and keep the group aligned.</p>
        </CardHeader>

        <CardContent>
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              onAddTask({ title, dueDate, assignedToId })
              handleClose()
            }}
          >
            <div className="field-group">
              <Label htmlFor="task-title">Task title</Label>
              <div className="input-icon-wrap">
                <CheckSquare size={18} />
                <Input
                  id="task-title"
                  type="text"
                  placeholder="Book flights"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="date-grid">
              <div className="field-group">
                <Label htmlFor="task-due-date">Due date</Label>
                <div className="input-icon-wrap">
                  <CalendarDays size={18} />
                  <Input
                    id="task-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <Label htmlFor="task-assignee">Assign to</Label>
                <div className="input-icon-wrap input-select-wrap">
                  <UserRound size={18} />
                  <select
                    id="task-assignee"
                    className="ui-select"
                    value={assignedToId}
                    onChange={(event) => setAssignedToId(event.target.value)}
                    required
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
