import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskStatus, TaskPriority } from "@/generated/prisma/client"

interface UpcomingTask {
  id: string
  title: string
  dueDate: Date | string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeName: string | null
  projectName: string
}

interface UpcomingTasksProps {
  tasks: UpcomingTask[]
}

const STATUS_CONFIG = {
  BACKLOG: { label: "Backlog", variant: "secondary" as const },
  TODO: { label: "Yapılacak", variant: "default" as const },
  IN_PROGRESS: { label: "Devam Ediyor", variant: "default" as const },
  IN_REVIEW: { label: "İncelemede", variant: "default" as const },
  DONE: { label: "Tamamlandı", variant: "default" as const },
}

const PRIORITY_CONFIG = {
  LOW: { label: "Düşük", className: "text-blue-600 bg-blue-50 border-blue-200" },
  MEDIUM: { label: "Orta", className: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  HIGH: { label: "Yüksek", className: "text-orange-600 bg-orange-50 border-orange-200" },
  URGENT: { label: "Acil", className: "text-red-600 bg-red-50 border-red-200" },
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Belirsiz"

    const dateObj = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffTime = dateObj.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} gün geçti`
    } else if (diffDays === 0) {
      return "Bugün"
    } else if (diffDays === 1) {
      return "Yarın"
    } else if (diffDays <= 7) {
      return `${diffDays} gün kaldı`
    } else {
      return dateObj.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      })
    }
  }

  const isOverdue = (date: Date | string | null) => {
    if (!date) return false
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.getTime() < new Date().getTime()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yaklaşan Görevler</CardTitle>
        <CardDescription>
          Teslim tarihi yaklaşan görevler
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Yaklaşan görev bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/gorevler/${task.id}`}
                className="block group"
              >
                <div className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.projectName}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", PRIORITY_CONFIG[task.priority].className)}
                    >
                      {PRIORITY_CONFIG[task.priority].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {isOverdue(task.dueDate) && (
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      )}
                      <Calendar className="h-3 w-3" />
                      <span
                        className={cn(
                          isOverdue(task.dueDate) && "text-red-600 font-medium"
                        )}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {task.assigneeName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.assigneeName}</span>
                      </div>
                    )}
                    <Badge variant={STATUS_CONFIG[task.status].variant} className="text-xs">
                      {STATUS_CONFIG[task.status].label}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
