"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  assignee: {
    id: string
    name: string
    image: string | null
  } | null
}

export default function ProjectListViewPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projeler/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Görev Listesi</h1>
          <p className="text-muted-foreground">
            Proje görevlerinin liste görünümü
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold mb-2">Görev Bulunamadı</h3>
          <p className="text-sm text-muted-foreground">
            Bu projede henüz görev oluşturulmamış
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Atanan</TableHead>
                <TableHead>Son Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => router.push(`/gorevler/${task.id}`)}
                >
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={TASK_STATUS_COLORS[task.status]}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={TASK_PRIORITY_COLORS[task.priority]}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Atanmamış
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span className="text-sm">
                        {format(new Date(task.dueDate), "d MMM yyyy", {
                          locale: tr,
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
