"use client"

import { Draggable } from "@hello-pangea/dnd"
import { Calendar, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from "@/lib/constants"
import { TaskPriority } from "@/generated/prisma/client"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface KanbanCardProps {
  task: {
    id: string
    title: string
    priority: TaskPriority
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
  index: number
  onClick?: () => void
}

export function KanbanCard({ task, index, onClick }: KanbanCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-3 mb-2
            hover:shadow-md transition-shadow cursor-pointer
            ${snapshot.isDragging ? "shadow-lg rotate-2" : ""}
          `}
        >
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {task.title}
            </h4>

            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className={`text-xs ${TASK_PRIORITY_COLORS[task.priority]}`}
              >
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>

              {task._count && task._count.comments > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task._count.comments}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(task.dueDate), "d MMM", { locale: tr })}
                  </span>
                </div>
              )}

              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
