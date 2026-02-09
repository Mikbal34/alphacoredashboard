"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { TaskStatus, TaskPriority, ProjectStatus } from "@/generated/prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MemberForm } from "@/components/team/member-form"
import { ArrowLeft, Calendar, Mail, Trash2, Edit, FolderKanban, CheckSquare } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import Link from "next/link"
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "@/lib/constants"

interface User {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: string
  assignedTasks: Array<{
    id: string
    title: string
    status: TaskStatus
    priority: TaskPriority
    dueDate: string | null
    project: {
      id: string
      name: string
      color: string
    }
  }>
  projectMembers: Array<{
    project: {
      id: string
      name: string
      status: ProjectStatus
      color: string
      description: string | null
    }
  }>
}

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) throw new Error("Failed to fetch user")
      const data = await response.json()
      setUser(data)
    } catch (error) {
      toast.error("Kullanıcı yüklenirken hata oluştu")
      console.error(error)
      router.push("/takim")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (data: any) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast.success("Üye başarıyla güncellendi")
      setEditDialogOpen(false)
      fetchUser()
    } catch (error: any) {
      toast.error(error.message || "Üye güncellenirken hata oluştu")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      toast.success("Üye başarıyla silindi")
      router.push("/takim")
    } catch (error: any) {
      toast.error(error.message || "Üye silinirken hata oluştu")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Katıldı:{" "}
                  {format(new Date(user.createdAt), "d MMMM yyyy", { locale: tr })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Üye Bilgilerini Düzenle</DialogTitle>
                </DialogHeader>
                <MemberForm
                  mode="edit"
                  defaultValues={{
                    name: user.name,
                    email: user.email,
                    password: "",
                  }}
                  onSubmit={handleUpdateUser}
                  isLoading={isUpdating}
                />
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Bu üye kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Siliniyor..." : "Sil"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assigned Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Atanan Görevler
            </CardTitle>
            <CardDescription>
              {user.assignedTasks.length} görev atanmış
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.assignedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz atanmış görev yok
              </p>
            ) : (
              <div className="space-y-3">
                {user.assignedTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projeler/${task.project.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {task.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.project.name}
                        </p>
                      </div>
                      <Badge
                        className={TASK_PRIORITY_COLORS[task.priority]}
                        variant="secondary"
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={TASK_STATUS_COLORS[task.status]}
                        variant="secondary"
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.dueDate), "d MMM", { locale: tr })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projeler
            </CardTitle>
            <CardDescription>
              {user.projectMembers.length} projede üye
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.projectMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz projede değil
              </p>
            ) : (
              <div className="space-y-3">
                {user.projectMembers.map(({ project }) => (
                  <Link
                    key={project.id}
                    href={`/projeler/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {project.name}
                          </h4>
                          {project.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={PROJECT_STATUS_COLORS[project.status]}
                        variant="secondary"
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
