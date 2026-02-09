import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  FileText,
  CheckSquare,
  DollarSign,
  Folder,
  User as UserIcon,
  Activity as ActivityIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string
  createdAt: Date | string
  userName: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const ENTITY_ICONS = {
  TASK: CheckSquare,
  PROJECT: Folder,
  TRANSACTION: DollarSign,
  INVOICE: FileText,
  USER: UserIcon,
}

const ENTITY_COLORS = {
  TASK: "text-blue-600 bg-blue-50",
  PROJECT: "text-purple-600 bg-purple-50",
  TRANSACTION: "text-green-600 bg-green-50",
  INVOICE: "text-orange-600 bg-orange-50",
  USER: "text-gray-600 bg-gray-50",
}

const ACTION_TRANSLATIONS: { [key: string]: string } = {
  CREATED: "oluşturdu",
  UPDATED: "güncelledi",
  DELETED: "sildi",
  COMPLETED: "tamamladı",
  ASSIGNED: "atadı",
  COMMENTED: "yorum yaptı",
}

const ENTITY_TRANSLATIONS: { [key: string]: string } = {
  TASK: "görevi",
  PROJECT: "projeyi",
  TRANSACTION: "işlemi",
  INVOICE: "faturayı",
  USER: "kullanıcıyı",
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const formatRelativeTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Az önce"
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    if (diffDays < 7) return `${diffDays} gün önce`

    return dateObj.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: diffDays > 365 ? "numeric" : undefined,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getActionText = (action: string, entityType: string) => {
    const actionText = ACTION_TRANSLATIONS[action] || action.toLowerCase()
    const entityText = ENTITY_TRANSLATIONS[entityType] || entityType.toLowerCase()
    return `${actionText} ${entityText}`
  }

  const getIcon = (entityType: string) => {
    const Icon = ENTITY_ICONS[entityType as keyof typeof ENTITY_ICONS] || ActivityIcon
    return Icon
  }

  const getIconColor = (entityType: string) => {
    return ENTITY_COLORS[entityType as keyof typeof ENTITY_COLORS] || "text-gray-600 bg-gray-50"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Aktiviteler</CardTitle>
        <CardDescription>
          Sistemdeki son yapılan işlemler
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Henüz aktivite bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getIcon(activity.entityType)
              const iconColor = getIconColor(activity.entityType)

              return (
                <div key={activity.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(activity.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.userName}</span>{" "}
                          <span className="text-muted-foreground">
                            {getActionText(activity.action, activity.entityType)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                      <div className={cn("p-1.5 rounded-md", iconColor)}>
                        <Icon className="h-3 w-3" />
                      </div>
                    </div>
                    {index < activities.length - 1 && (
                      <div className="mt-4 h-px bg-border" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
