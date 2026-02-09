"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Calendar, FileText, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import Link from "next/link"

interface ReportSchedule {
  id: string
  name: string
  frequency: "DAILY" | "WEEKLY" | "MONTHLY"
  recipients: string[]
  isActive: boolean
  lastRunAt: string | null
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  entityType: string
  createdAt: string
  metadata: any
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningDaily, setIsRunningDaily] = useState(false)
  const [isRunningWeekly, setIsRunningWeekly] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [schedulesRes, logsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/activity-log?entityType=report&limit=5"),
      ])

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        setSchedules(schedulesData)
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setRecentLogs(logsData.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunDailyReport = async () => {
    setIsRunningDaily(true)
    try {
      const response = await fetch("/api/cron/daily-report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to run daily report")
      }

      toast.success("Günlük rapor başarıyla oluşturuldu")
      fetchData()
    } catch (error) {
      toast.error("Rapor oluşturulurken hata oluştu")
      console.error(error)
    } finally {
      setIsRunningDaily(false)
    }
  }

  const handleRunWeeklyReport = async () => {
    setIsRunningWeekly(true)
    try {
      const response = await fetch("/api/cron/weekly-report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to run weekly report")
      }

      toast.success("Haftalık rapor başarıyla oluşturuldu")
      fetchData()
    } catch (error) {
      toast.error("Rapor oluşturulurken hata oluştu")
      console.error(error)
    } finally {
      setIsRunningWeekly(false)
    }
  }

  const activeSchedulesCount = schedules.filter((s) => s.isActive).length
  const lastReportDate = recentLogs.length > 0
    ? new Date(recentLogs[0].createdAt)
    : null

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Raporlama
        </h1>
        <p className="text-muted-foreground">
          Otomatik raporları görüntüleyin ve yönetin
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Rapor</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastReportDate
                ? format(lastReportDate, "d MMM", { locale: tr })
                : "Henüz yok"}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastReportDate
                ? format(lastReportDate, "HH:mm", { locale: tr })
                : "Henüz rapor oluşturulmadı"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Programlar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSchedulesCount}</div>
            <p className="text-xs text-muted-foreground">
              Toplam {schedules.length} program
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentLogs.length}</div>
            <p className="text-xs text-muted-foreground">Rapor oluşturuldu</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
          <CardDescription>Raporları manuel olarak çalıştırın</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={handleRunDailyReport}
            disabled={isRunningDaily}
            variant="outline"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {isRunningDaily ? "Çalıştırılıyor..." : "Günlük Rapor Çalıştır"}
          </Button>
          <Button
            onClick={handleRunWeeklyReport}
            disabled={isRunningWeekly}
            variant="outline"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {isRunningWeekly ? "Çalıştırılıyor..." : "Haftalık Rapor Çalıştır"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Son Raporlar</CardTitle>
          <CardDescription>En son oluşturulan raporlar</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz rapor oluşturulmadı
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {log.metadata?.reportType === "daily"
                        ? "Günlük Rapor"
                        : "Haftalık Rapor"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "d MMMM yyyy, HH:mm", {
                        locale: tr,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {log.metadata?.emailsSent || 0} email gönderildi
                    </p>
                    {log.metadata?.transactionsCount !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {log.metadata.transactionsCount} işlem
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links to Other Pages */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/raporlama/sablonlar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapor Şablonları
              </CardTitle>
              <CardDescription>
                Otomatik rapor programlarını yönetin
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/raporlama/aktivite-log">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Aktivite Günlüğü
              </CardTitle>
              <CardDescription>
                Tüm sistem aktivitelerini görüntüleyin
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
