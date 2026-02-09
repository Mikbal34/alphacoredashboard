import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TransactionType, TaskStatus } from "@/generated/prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 401 }
      )
    }

    // Calculate total income and expenses
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ])

    const totalIncome = incomeResult._sum.amount || 0
    const totalExpense = expenseResult._sum.amount || 0
    const netProfit = totalIncome - totalExpense

    // Count active tasks (not DONE)
    const activeTaskCount = await prisma.task.count({
      where: {
        status: {
          not: TaskStatus.DONE,
        },
      },
    })

    // Get monthly data for the last 12 months
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    })

    // Group transactions by month
    const monthlyDataMap = new Map<string, { income: number; expense: number }>()

    // Initialize all 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyDataMap.set(monthKey, { income: 0, expense: 0 })
    }

    // Populate with actual data
    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthData = monthlyDataMap.get(monthKey)

      if (monthData) {
        if (transaction.type === TransactionType.INCOME) {
          monthData.income += transaction.amount
        } else {
          monthData.expense += transaction.amount
        }
      }
    })

    const monthlyData = Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }))

    // Get upcoming tasks (5 tasks with nearest due dates)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: {
          not: TaskStatus.DONE,
        },
        dueDate: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        priority: true,
        assignee: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    })

    // Get recent activities (10 most recent)
    const recentActivities = await prisma.activityLog.findMany({
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    return NextResponse.json({
      totalIncome,
      totalExpense,
      netProfit,
      activeTaskCount,
      monthlyData,
      upcomingTasks: upcomingTasks.map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        assigneeName: task.assignee?.name || null,
        projectName: task.project.name,
      })),
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        createdAt: activity.createdAt,
        userName: activity.user.name,
      })),
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "İstatistikler yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
