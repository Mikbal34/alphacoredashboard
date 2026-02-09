"use client"

import { useEffect, useState } from "react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { FinancialSummary } from "@/components/dashboard/financial-summary"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  CheckSquare,
  AlertCircle,
} from "lucide-react"
import { TaskStatus, TaskPriority } from "@/generated/prisma/client"

interface DashboardStats {
  totalIncome: number
  totalExpense: number
  netProfit: number
  activeTaskCount: number
  monthlyData: Array<{
    month: string
    income: number
    expense: number
  }>
  upcomingTasks: Array<{
    id: string
    title: string
    dueDate: Date | string | null
    status: TaskStatus
    priority: TaskPriority
    assigneeName: string | null
    projectName: string
  }>
  recentActivities: Array<{
    id: string
    action: string
    entityType: string
    entityId: string
    createdAt: Date | string
    userName: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/stats")

        if (!response.ok) {
          throw new Error("İstatistikler yüklenemedi")
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu")
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>

        {/* Bottom Section Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Hata</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const isProfit = stats.netProfit >= 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          İşletmenizin genel durumunu buradan takip edebilirsiniz
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalIncome)}
          description="Tüm zamanlar"
          icon={TrendingUp}
          className="border-l-4 border-l-green-500"
        />
        <StatsCard
          title="Toplam Gider"
          value={formatCurrency(stats.totalExpense)}
          description="Tüm zamanlar"
          icon={TrendingDown}
          className="border-l-4 border-l-red-500"
        />
        <StatsCard
          title="Net Kâr"
          value={formatCurrency(stats.netProfit)}
          description={isProfit ? "Pozitif bakiye" : "Negatif bakiye"}
          icon={DollarSign}
          className={`border-l-4 ${
            isProfit ? "border-l-blue-500" : "border-l-red-500"
          }`}
        />
        <StatsCard
          title="Aktif Görevler"
          value={stats.activeTaskCount.toString()}
          description="Devam eden görevler"
          icon={CheckSquare}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      {/* Financial Chart */}
      <FinancialSummary data={stats.monthlyData} />

      {/* Bottom Section: Tasks and Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingTasks tasks={stats.upcomingTasks} />
        <RecentActivity activities={stats.recentActivities} />
      </div>
    </div>
  )
}
