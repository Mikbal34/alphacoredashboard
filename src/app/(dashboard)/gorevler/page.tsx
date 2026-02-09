"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CheckSquare, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from "@/lib/constants"
import { TaskStatus, TaskPriority } from "@/generated/prisma/client"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  project: {
    id: string
    name: string
    color: string
  }
  assignee: {
    id: string
    name: string
    image: string | null
  } | null
  _count?: {
    comments: number
  }
}

export default function TasksPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks()
    }
  }, [session])

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (session?.user?.id) {
        params.append("assigneeId", session.user.id)
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error("Fetch tasks error:", error)
      toast.error("Görevler yüklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false
    if (priorityFilter !== "all" && task.priority !== priorityFilter)
      return false
    return true
  })

  const groupedTasks: Record<TaskStatus, Task[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  }

  filteredTasks.forEach((task) => {
    groupedTasks[task.status].push(task)
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Görevlerim</h1>
        <p className="text-muted-foreground">
          Size atanan tüm görevleri görüntüleyin
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Öncelik filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(statusFilter !== "all" || priorityFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all")
              setPriorityFilter("all")
            }}
          >
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckSquare className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Görev Bulunamadı</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? "Bu filtrelere uygun görev bulunamadı"
                : "Size henüz görev atanmamış"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => {
            if (statusTasks.length === 0) return null

            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {TASK_STATUS_LABELS[status as TaskStatus]}
                  </h2>
                  <Badge variant="secondary" className="rounded-full">
                    {statusTasks.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/gorevler/${task.id}`)}
                    >
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold line-clamp-2">
                            {task.title}
                          </h3>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {task.project.name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              TASK_PRIORITY_COLORS[task.priority]
                            }`}
                          >
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </Badge>

                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(task.dueDate), "d MMM", {
                                locale: tr,
                              })}
                            </span>
                          )}
                        </div>

                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={task.assignee.image || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {task.assignee.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
