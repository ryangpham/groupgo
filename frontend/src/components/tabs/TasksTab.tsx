import { useEffect, useMemo, useState } from 'react'
import { Calendar, Pencil, Plus } from 'lucide-react'
import { AddTaskModal } from '../AddTaskModal'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { useAuth } from '../../hooks/useAuth'
import { parseDateOnly } from '../../lib/date'
import { ApiError, createTask, deleteTask, getTripTasks, updateTask } from '../../lib/api'

type Member = {
  id: string
  name: string
  initials: string
}

type TaskItem = {
  id: string
  title: string
  completed: boolean
  assignedTo: Member
  dueDate: string
  assignedUserId: string | null
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'TR'
}

function parseUserId(value: string | null | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null
  }

  return Number(value)
}

export default function TasksTab({ members, tripId }: { members: Member[]; tripId: string }) {
  const { token } = useAuth()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError('')

    getTripTasks(token, tripId)
      .then((taskRows) => {
        if (cancelled) {
          return
        }

        const fallbackAssignee = members[0] ?? { id: '0', name: 'Traveler', initials: 'TR' }

        setTasks(
          taskRows.map((taskRow) => {
            const assignedUserId =
              taskRow.assigned_user_id !== null && taskRow.assigned_user_id !== undefined
                ? String(taskRow.assigned_user_id)
                : null
            const assignedName =
              typeof taskRow.assigned_user_name === 'string' && taskRow.assigned_user_name.trim()
                ? taskRow.assigned_user_name
                : null
            const assignedTo =
              members.find((member) => member.id === assignedUserId) ??
              (assignedName
                ? { id: assignedUserId ?? '0', name: assignedName, initials: getInitials(assignedName) }
                : fallbackAssignee)

            return {
              id: String(taskRow.task_id),
              title: String(taskRow.title),
              completed: Boolean(taskRow.completed),
              assignedTo,
              dueDate: typeof taskRow.due_date === 'string' ? taskRow.due_date : '',
              assignedUserId,
            }
          }),
        )
      })
      .catch((apiError) => {
        if (!cancelled) {
          setError(apiError instanceof ApiError ? apiError.message : 'Unable to load tasks')
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
  }, [members, token, tripId])

  const progressLabel = useMemo(() => {
    const completedCount = tasks.filter((task) => task.completed).length
    return `${completedCount} of ${tasks.length} complete`
  }, [tasks])

  const closeModal = () => {
    setSelectedTask(null)
    setIsTaskModalOpen(false)
  }

  const openCreateModal = () => {
    setSelectedTask(null)
    setIsTaskModalOpen(true)
  }

  const openEditModal = (task: TaskItem) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleToggleTask = (taskId: string) => {
    const existingTask = tasks.find((item) => item.id === taskId)
    const nextCompleted = existingTask ? !existingTask.completed : false

    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, completed: nextCompleted } : task)))

    if (!token || !existingTask) {
      return
    }

    updateTask(token, taskId, {
      title: existingTask.title,
      due_date: existingTask.dueDate || null,
      completed: nextCompleted,
      assigned_user_id: parseUserId(existingTask.assignedUserId),
    }).catch(() => {
      setTasks((current) => current.map((item) => (item.id === taskId ? { ...item, completed: existingTask.completed } : item)))
    })
  }

  const handleSubmitTask = async (taskData: { title: string; dueDate: string; assignedToId: string }) => {
    if (!token) {
      return
    }

    const assignedMember = members.find((member) => member.id === taskData.assignedToId) ?? members[0]

    try {
      setIsSubmitting(true)
      setError('')

      if (selectedTask) {
        const updatedTask = await updateTask(token, selectedTask.id, {
          title: taskData.title,
          due_date: taskData.dueDate || null,
          completed: selectedTask.completed,
          assigned_user_id: parseUserId(taskData.assignedToId),
        })

        setTasks((current) =>
          current.map((task) =>
            task.id === selectedTask.id
              ? {
                  ...task,
                  title: String(updatedTask.title),
                  dueDate: typeof updatedTask.due_date === 'string' ? updatedTask.due_date : '',
                  assignedTo: assignedMember,
                  assignedUserId:
                    updatedTask.assigned_user_id !== null && updatedTask.assigned_user_id !== undefined
                      ? String(updatedTask.assigned_user_id)
                      : taskData.assignedToId,
                }
              : task,
          ),
        )
      } else {
        const createdTask = await createTask(token, {
          trip_id: Number(tripId),
          title: taskData.title,
          due_date: taskData.dueDate || null,
          completed: false,
          assigned_user_id: parseUserId(assignedMember?.id),
        })

        setTasks((current) => [
          ...current,
          {
            id: String(createdTask.task_id),
            title: String(createdTask.title),
            completed: Boolean(createdTask.completed),
            assignedTo: assignedMember,
            dueDate: typeof createdTask.due_date === 'string' ? createdTask.due_date : '',
            assignedUserId:
              createdTask.assigned_user_id !== null && createdTask.assigned_user_id !== undefined
                ? String(createdTask.assigned_user_id)
                : assignedMember
                  ? assignedMember.id
                  : null,
          },
        ])
      }

      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to save task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!token || !selectedTask) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      await deleteTask(token, selectedTask.id)
      setTasks((current) => current.filter((task) => task.id !== selectedTask.id))
      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = parseDateOnly(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Tasks</p>
          <h2>Track your trip preparation progress</h2>
          <p>{progressLabel}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          <span>Add Task</span>
        </Button>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      {isLoading ? (
        <div className="reservation-empty-state">
          <Calendar size={40} />
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length > 0 ? (
        <div className="task-list-shell">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={['task-row', index !== tasks.length - 1 ? 'task-row-border' : ''].filter(Boolean).join(' ')}
            >
              <Checkbox id={`task-${task.id}`} checked={task.completed} onChange={() => handleToggleTask(task.id)} />

              <label
                htmlFor={`task-${task.id}`}
                className={['task-title', task.completed ? 'is-complete' : ''].filter(Boolean).join(' ')}
              >
                {task.title}
              </label>

              <div className="task-meta">
                <div className="task-assignee">
                  <Avatar className="task-assignee-avatar">
                    <AvatarFallback>{task.assignedTo.initials}</AvatarFallback>
                  </Avatar>
                  <span>{task.assignedTo.name}</span>
                </div>
                <div className="task-date">
                  <Calendar size={15} />
                  <span>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                </div>
                <button type="button" className="inline-edit-button" onClick={() => openEditModal(task)}>
                  <Pencil size={15} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="reservation-empty-state">
          <Calendar size={40} />
          <p>No tasks yet. Add your first trip task to get started.</p>
        </div>
      )}

      <AddTaskModal
        key={selectedTask ? `edit-${selectedTask.id}` : 'create-task'}
        open={isTaskModalOpen}
        onClose={closeModal}
        onSubmitTask={handleSubmitTask}
        members={members}
        initialValues={
          selectedTask
            ? {
                title: selectedTask.title,
                dueDate: selectedTask.dueDate,
                assignedToId: selectedTask.assignedUserId ?? selectedTask.assignedTo.id,
              }
            : undefined
        }
        mode={selectedTask ? 'edit' : 'create'}
        onDeleteTask={selectedTask ? handleDeleteTask : undefined}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
      />
    </section>
  )
}
