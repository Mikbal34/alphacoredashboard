"use client"

import { useState, useEffect } from "react"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { KanbanColumn } from "./kanban-column"
import { TaskStatus, TaskPriority } from "@/generated/prisma/client"
import { toast } from "sonner"

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

interface KanbanBoardProps {
  initialTasks: Task[]
  onTaskClick: (taskId: string) => void
}

const STATUSES: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]

export function KanbanBoard({ initialTasks, onTaskClick }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order)
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const sourceStatus = source.droppableId as TaskStatus
    const destStatus = destination.droppableId as TaskStatus

    // Create a copy of tasks for optimistic update
    const tasksCopy = [...tasks]
    const movedTask = tasksCopy.find((t) => t.id === draggableId)

    if (!movedTask) return

    // Remove from source
    const sourceTasks = tasksCopy
      .filter((t) => t.status === sourceStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order)

    // Get destination tasks
    const destTasks = tasksCopy
      .filter((t) => t.status === destStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order)

    // Insert at new position
    destTasks.splice(destination.index, 0, movedTask)

    // Update the moved task
    movedTask.status = destStatus
    movedTask.order = destination.index

    // Reorder destination tasks
    destTasks.forEach((task, index) => {
      task.order = index
    })

    // Reorder source tasks if different column
    if (sourceStatus !== destStatus) {
      sourceTasks.forEach((task, index) => {
        task.order = index
      })
    }

    // Optimistic update
    setTasks([...tasksCopy])

    try {
      // Call API to update
      const response = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: draggableId,
          status: destStatus,
          order: destination.index,
        }),
      })

      if (!response.ok) {
        throw new Error("Görev güncellenemedi")
      }

      toast.success("Görev başarıyla taşındı")
    } catch (error) {
      // Rollback on error
      setTasks(initialTasks)
      toast.error("Görev taşınırken bir hata oluştu")
      console.error("Drag end error:", error)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
