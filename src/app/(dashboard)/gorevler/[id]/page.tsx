"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Calendar, User, FolderKanban, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TaskComments } from "@/components/projects/task-comments"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  createdAt: Date | string
  updatedAt: Date | string
  project: {
    id: string
    name: string
    color: string
    status: string
  }
  assignee: {
    id: string
    name: string
    email: string
    image: string | null
  } | null
  creator: {
    id: string
    name: string
    email: string
    image: string | null
  }
  comments: Array<{
    id: string
    content: string
    createdAt: Date | string
    user: {
      id: string
      name: string
      email: string
      image: string | null
    }
  }>
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Görev bulunamadı")
          router.push("/gorevler")
          return
        }
        throw new Error("Failed to fetch task")
      }
      const data = await response.json()
      setTask(data)
      setEditedTitle(data.title)
      setEditedDescription(data.description || "")
    } catch (error) {
      console.error("Fetch task error:", error)
      toast.error("Görev yüklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const updateTask = async (updates: Partial<Task>) => {
    if (!task) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updates.title || task.title,
          description: updates.description !== undefined ? updates.description : task.description,
          status: updates.status || task.status,
          priority: updates.priority || task.priority,
          dueDate: updates.dueDate !== undefined ? updates.dueDate : task.dueDate,
          projectId: task.project.id,
          assigneeId: updates.assignee?.id || task.assignee?.id || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to update task")

      toast.success("Görev güncellendi")
      fetchTask()
    } catch (error) {
      console.error("Update task error:", error)
      toast.error("Görev güncellenirken bir hata oluştu")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete task")

      toast.success("Görev silindi")
      router.push(`/projeler/${task?.project.id}`)
    } catch (error) {
      console.error("Delete task error:", error)
      toast.error("Görev silinirken bir hata oluştu")
      setIsDeleting(false)
    }
  }

  const handleTitleBlur = () => {
    if (editedTitle !== task?.title && editedTitle.trim()) {
      updateTask({ title: editedTitle })
    } else {
      setEditedTitle(task?.title || "")
    }
  }

  const handleDescriptionBlur = () => {
    if (editedDescription !== (task?.description || "")) {
      updateTask({ description: editedDescription })
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

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h3 className="text-lg font-semibold mb-2">Görev Bulunamadı</h3>
        <Button onClick={() => router.push("/gorevler")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Görevlere Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projeler/${task.project.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              <span className="text-sm text-muted-foreground">
                {task.project.name}
              </span>
            </div>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Görevi Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Siliniyor..." : "Sil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-2xl font-bold border-none p-0 focus-visible:ring-0"
            disabled={isUpdating}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-2">Açıklama</Label>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Görev açıklaması ekleyin..."
              className="resize-none min-h-[100px]"
              rows={4}
              disabled={isUpdating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Durum</Label>
              <Select
                value={task.status}
                onValueChange={(value) =>
                  updateTask({ status: value as TaskStatus })
                }
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${
                            TASK_STATUS_COLORS[value as TaskStatus]
                          } text-xs`}
                        >
                          {label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Öncelik</Label>
              <Select
                value={task.priority}
                onValueChange={(value) =>
                  updateTask({ priority: value as TaskPriority })
                }
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`${
                              TASK_PRIORITY_COLORS[value as TaskPriority]
                            } text-xs`}
                          >
                            {label}
                          </Badge>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Atanan</p>
                {task.assignee ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Atanmamış
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Son Tarih</p>
                <p className="text-sm font-medium mt-1">
                  {task.dueDate
                    ? format(new Date(task.dueDate), "d MMMM yyyy", {
                        locale: tr,
                      })
                    : "Belirlenmemiş"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Oluşturan</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.creator.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {task.creator.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {task.creator.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <TaskComments
            taskId={taskId}
            initialComments={task.comments}
            currentUserId={session?.user?.id || ""}
          />
        </CardContent>
      </Card>
    </div>
  )
}
