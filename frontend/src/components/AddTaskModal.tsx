import { useState } from 'react'
import { CalendarDays, CheckSquare, Trash2, UserRound } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

type Member = {
  id: string
  name: string
  initials: string
}

type TaskFormData = {
  title: string
  dueDate: string
  assignedToId: string
}

type AddTaskModalProps = {
  open: boolean
  onClose: () => void
  onSubmitTask: (taskData: TaskFormData) => void | Promise<void>
  members: Member[]
  initialValues?: TaskFormData
  mode?: 'create' | 'edit'
  onDeleteTask?: () => void | Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
}

export function AddTaskModal({
  open,
  onClose,
  onSubmitTask,
  members,
  initialValues,
  mode = 'create',
  onDeleteTask,
  isSubmitting = false,
  isDeleting = false,
}: AddTaskModalProps) {
  const defaultValues: TaskFormData = initialValues ?? {
    title: '',
    dueDate: '',
    assignedToId: members[0]?.id ?? '',
  }

  const [title, setTitle] = useState(defaultValues.title)
  const [dueDate, setDueDate] = useState(defaultValues.dueDate)
  const [assignedToId, setAssignedToId] = useState(defaultValues.assignedToId)

  if (!open) {
    return null
  }

  const handleClose = () => {
    setTitle(defaultValues.title)
    setDueDate(defaultValues.dueDate)
    setAssignedToId(defaultValues.assignedToId)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleClose} role="presentation">
      <Card className="modal-card" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="modal-header">
          <div className="modal-kicker">
            <CheckSquare size={16} />
            <span>{mode === 'edit' ? 'Edit task' : 'Add a task'}</span>
          </div>
          <h2>{mode === 'edit' ? 'Update task details' : 'Track a new trip task'}</h2>
          <p className="form-copy">Capture one responsibility, assign it, and keep the group aligned.</p>
        </CardHeader>

        <CardContent>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault()
              await onSubmitTask({ title, dueDate, assignedToId })
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
                  disabled={isSubmitting || isDeleting}
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
                    disabled={isSubmitting || isDeleting}
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
                    disabled={isSubmitting || isDeleting}
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

            <div className="modal-actions modal-actions-split">
              {mode === 'edit' && onDeleteTask ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="ui-button-danger"
                  onClick={async () => await onDeleteTask()}
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
                  {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Adding...') : mode === 'edit' ? 'Save Changes' : 'Add Task'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
