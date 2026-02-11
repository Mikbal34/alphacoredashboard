import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getResend } from "@/lib/resend"
import { MonthlyReportEmail } from "@/emails/monthly-report"
import { render } from "@react-email/components"

export async function POST(req: NextRequest) {
  try {
    // Check for CRON_SECRET
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get this month's date range
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Previous month range (for comparison)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // Get this month's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        category: true,
      },
    })

    // Calculate financial summary
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0)

    const net = income - expense

    // Previous month net for comparison
    const prevTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
    })

    const prevIncome = prevTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0)

    const prevExpense = prevTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0)

    const previousMonthNet = prevTransactions.length > 0 ? prevIncome - prevExpense : null

    // Get task statistics for this month
    const allTasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    const completedTasks = allTasks.filter((t) => t.status === "DONE").length
    const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length
    const totalTasks = allTasks.length

    // Get top spending categories
    const categoryExpenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => {
        const categoryName = t.category.name
        acc[categoryName] = (acc[categoryName] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryExpenses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))

    // Get active report schedules for monthly reports
    const schedules = await prisma.reportSchedule.findMany({
      where: {
        frequency: "MONTHLY",
        isActive: true,
      },
    })

    const reportData = {
      monthStart,
      monthEnd,
      financialSummary: {
        income,
        expense,
        net,
      },
      taskStatistics: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        total: totalTasks,
      },
      topCategories,
      transactionsCount: transactions.length,
      previousMonthNet,
    }

    // Send emails to all recipients
    const emailResults = []
    for (const schedule of schedules) {
      for (const recipient of schedule.recipients) {
        try {
          const emailHtml = await render(MonthlyReportEmail(reportData))

          await getResend().emails.send({
            from: process.env.EMAIL_FROM || "noreply@alphacore.com.tr",
            to: recipient,
            subject: `Aylık Rapor - ${monthStart.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}`,
            html: emailHtml,
          })

          emailResults.push({ recipient, success: true })
        } catch (emailError) {
          console.error(`Failed to send email to ${recipient}:`, emailError)
          emailResults.push({ recipient, success: false, error: String(emailError) })
        }
      }

      // Update last run time
      await prisma.reportSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: new Date(),
        },
      })
    }

    // Log activity
    if (schedules.length > 0) {
      await prisma.activityLog.create({
        data: {
          action: "generated",
          entityType: "report",
          entityId: "monthly-report",
          userId: schedules[0].userId,
          metadata: {
            reportType: "monthly",
            monthStart: monthStart.toISOString(),
            monthEnd: monthEnd.toISOString(),
            transactionsCount: transactions.length,
            tasksCompleted: completedTasks,
            emailsSent: emailResults.filter((r) => r.success).length,
            emailsFailed: emailResults.filter((r) => !r.success).length,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      reportData,
      emailResults,
      schedulesProcessed: schedules.length,
    })
  } catch (error) {
    console.error("POST /api/cron/monthly-report error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
