"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { KanbanBoard } from "@/components/projects/kanban-board"
import { TaskForm } from "@/components/projects/task-form"
import { ProjectMembers } from "@/components/projects/project-members"
import { toast } from "sonner"
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from "@/lib/constants"
import { ProjectStatus, TaskStatus, TaskPriority, ProjectRole } from "@/generated/prisma/client"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskFormValues } from "@/lib/validations/task"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  color: string
  startDate: Date | null
  endDate: Date | null
  members: Array<{
    id: string
    role: ProjectRole
    user: {
      id: string
      name: string
      email: string
      image: string | null
    }
  }>
  tasks: Array<{
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
  }>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Proje bulunamadı")
          router.push("/projeler")
          return
        }
        throw new Error("Failed to fetch project")
      }
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Fetch project error:", error)
      toast.error("Proje yüklenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async (values: TaskFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to create task")

      toast.success("Görev başarıyla oluşturuldu")
      setIsDialogOpen(false)
      fetchProject()
    } catch (error) {
      console.error("Create task error:", error)
      toast.error("Görev oluşturulurken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTaskClick = (taskId: string) => {
    router.push(`/gorevler/${taskId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h3 className="text-lg font-semibold mb-2">Proje Bulunamadı</h3>
        <Button onClick={() => router.push("/projeler")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Projelere Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/projeler")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge
              variant="secondary"
              className={PROJECT_STATUS_COLORS[project.status]}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Görev
        </Button>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="liste">Liste</TabsTrigger>
          <TabsTrigger value="uyeler">Üyeler</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard
            initialTasks={project.tasks}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="liste" className="mt-6">
          <div className="text-center py-8 text-muted-foreground">
            Liste görünümü için{" "}
            <Link
              href={`/projeler/${projectId}/liste`}
              className="text-primary hover:underline"
            >
              buraya tıklayın
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="uyeler" className="mt-6">
          <ProjectMembers
            projectId={projectId}
            members={project.members}
            onMembersChange={fetchProject}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Görev Oluştur</DialogTitle>
            <DialogDescription>
              {project.name} projesi için yeni bir görev oluşturun
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            members={project.members}
            onSubmit={handleCreateTask}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
