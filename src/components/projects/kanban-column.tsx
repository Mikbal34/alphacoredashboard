"use client"

import { Droppable } from "@hello-pangea/dnd"
import { KanbanCard } from "./kanban-card"
import { TASK_STATUS_LABELS } from "@/lib/constants"
import { TaskStatus, TaskPriority } from "@/generated/prisma/client"

interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  order: number
  dueDate: Date | null
  assignee: {
    id: string
    name: string
    image: string | null
  } | null
  _count?: {
    comments: number
  }
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (taskId: string) => void
}

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  const columnColors: Record<TaskStatus, string> = {
    BACKLOG: "bg-gray-100 dark:bg-gray-800",
    TODO: "bg-slate-100 dark:bg-slate-800",
    IN_PROGRESS: "bg-blue-100 dark:bg-blue-900",
    IN_REVIEW: "bg-yellow-100 dark:bg-yellow-900",
    DONE: "bg-green-100 dark:bg-green-900",
  }

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px]">
      <div className={`${columnColors[status]} rounded-t-lg px-4 py-3`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {TASK_STATUS_LABELS[status]}
          </h3>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 bg-gray-50 dark:bg-gray-900 rounded-b-lg p-2
              min-h-[200px] transition-colors
              ${snapshot.isDraggingOver ? "bg-gray-100 dark:bg-gray-800" : ""}
            `}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
