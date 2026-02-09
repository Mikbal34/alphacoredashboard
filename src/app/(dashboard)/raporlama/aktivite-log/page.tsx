"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: any
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface User {
  id: string
  name: string
}

const ACTION_LABELS: Record<string, string> = {
  created: "oluşturdu",
  updated: "güncelledi",
  deleted: "sildi",
  generated: "oluşturdu",
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  user: "Kullanıcı",
  project: "Proje",
  task: "Görev",
  transaction: "İşlem",
  invoice: "Fatura",
  category: "Kategori",
  report: "Rapor",
  report_schedule: "Rapor Programı",
}

const ENTITY_TYPE_COLORS: Record<string, string> = {
  user: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  project: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  task: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  transaction: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  invoice: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  category: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  report: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  report_schedule: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [page, entityTypeFilter, userFilter])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      })

      if (entityTypeFilter !== "all") {
        params.append("entityType", entityTypeFilter)
      }

      if (userFilter !== "all") {
        params.append("userId", userFilter)
      }

      const response = await fetch(`/api/activity-log?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch logs")

      const data = await response.json()
      setLogs(data.data)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      toast.error("Aktivite günlüğü yüklenirken hata oluştu")
      console.error(error)
    } finally {
      setIsLoading(false)
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

  const getActivityDescription = (log: ActivityLog) => {
    const action = ACTION_LABELS[log.action] || log.action
    const entityType = ENTITY_TYPE_LABELS[log.entityType] || log.entityType

    let details = ""
    if (log.metadata) {
      if (log.metadata.projectName) {
        details = ` - ${log.metadata.projectName}`
      } else if (log.metadata.taskTitle) {
        details = ` - ${log.metadata.taskTitle}`
      } else if (log.metadata.userName) {
        details = ` - ${log.metadata.userName}`
      } else if (log.metadata.scheduleName) {
        details = ` - ${log.metadata.scheduleName}`
      }
    }

    return `${entityType} ${action}${details}`
  }

  const handleResetFilters = () => {
    setEntityTypeFilter("all")
    setUserFilter("all")
    setPage(1)
  }

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Aktivite Günlüğü
        </h1>
        <p className="text-muted-foreground">
          Tüm sistem aktivitelerini görüntüleyin
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrele
          </CardTitle>
          <CardDescription>Aktiviteleri filtreleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Aktivite Tipi
              </label>
              <Select
                value={entityTypeFilter}
                onValueChange={(value) => {
                  setEntityTypeFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm aktiviteler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="user">Kullanıcı</SelectItem>
                  <SelectItem value="project">Proje</SelectItem>
                  <SelectItem value="task">Görev</SelectItem>
                  <SelectItem value="transaction">İşlem</SelectItem>
                  <SelectItem value="invoice">Fatura</SelectItem>
                  <SelectItem value="category">Kategori</SelectItem>
                  <SelectItem value="report">Rapor</SelectItem>
                  <SelectItem value="report_schedule">Rapor Programı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Kullanıcı</label>
              <Select
                value={userFilter}
                onValueChange={(value) => {
                  setUserFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm kullanıcılar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(entityTypeFilter !== "all" || userFilter !== "all") && (
              <div className="flex items-end">
                <Button variant="outline" onClick={handleResetFilters}>
                  Filtreleri Temizle
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                Aktivite bulunamadı
              </h3>
              <p className="text-muted-foreground mt-2">
                Seçilen filtrelere uygun aktivite yok
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Aktivite</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Zaman</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={log.user.image || undefined}
                              alt={log.user.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(log.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{log.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getActivityDescription(log)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={ENTITY_TYPE_COLORS[log.entityType]}
                          variant="secondary"
                        >
                          {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Sonraki
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
