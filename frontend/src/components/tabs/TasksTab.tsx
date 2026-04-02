import { useMemo, useState } from 'react'
import { Calendar, Plus } from 'lucide-react'
import { AddTaskModal } from '../AddTaskModal'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'

type Member = {
  id: string
  name: string
  initials: string
}

export default function TasksTab({ members }: { members: Member[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Book flights',
      completed: true,
      assignedTo: members[0],
      dueDate: '2026-06-15',
    },
    {
      id: '2',
      title: 'Reserve beach resort',
      completed: true,
      assignedTo: members[1] ?? members[0],
      dueDate: '2026-06-20',
    },
    {
      id: '3',
      title: 'Plan day trip itinerary',
      completed: false,
      assignedTo: members[0],
      dueDate: '2026-07-01',
    },
    {
      id: '4',
      title: 'Book snorkeling tour',
      completed: false,
      assignedTo: members[2] ?? members[0],
      dueDate: '2026-07-05',
    },
    {
      id: '5',
      title: 'Arrange airport transfers',
      completed: false,
      assignedTo: members[1] ?? members[0],
      dueDate: '2026-07-10',
    },
  ])

  const progressLabel = useMemo(() => {
    const completedCount = tasks.filter((task) => task.completed).length
    return `${completedCount} of ${tasks.length} complete`
  }, [tasks])

  const handleToggleTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    )
  }

  const handleAddTask = (taskData: { title: string; dueDate: string; assignedToId: string }) => {
    const assignedMember = members.find((member) => member.id === taskData.assignedToId) ?? members[0]

    setTasks((current) => [
      ...current,
      {
        id: String(current.length + 1),
        title: taskData.title,
        completed: false,
        assignedTo: assignedMember,
        dueDate: taskData.dueDate,
      },
    ])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add Task</span>
        </Button>
      </div>

      <div className="task-list-shell">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={['task-row', index !== tasks.length - 1 ? 'task-row-border' : ''].filter(Boolean).join(' ')}
          >
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onChange={() => handleToggleTask(task.id)}
            />

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
                <span>{formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AddTaskModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={handleAddTask}
        members={members}
      />
    </section>
  )
}
