import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { WeeklyReportEmail } from "@/emails/weekly-report"
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

    // Get this week's date range (Monday to Sunday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    // Get this week's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: weekStart,
          lt: weekEnd,
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

    // Get task statistics
    const allTasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
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

    // Get active report schedules for weekly reports
    const schedules = await prisma.reportSchedule.findMany({
      where: {
        frequency: "WEEKLY",
        isActive: true,
      },
    })

    const reportData = {
      weekStart,
      weekEnd,
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
    }

    // Try to send emails to all recipients
    const emailResults = []
    for (const schedule of schedules) {
      for (const recipient of schedule.recipients) {
        try {
          const emailHtml = await render(WeeklyReportEmail(reportData))

          await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@alphacore.com",
            to: recipient,
            subject: `Haftalık Rapor - ${weekStart.toLocaleDateString("tr-TR")} - ${weekEnd.toLocaleDateString("tr-TR")}`,
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
          entityId: "weekly-report",
          userId: schedules[0].userId,
          metadata: {
            reportType: "weekly",
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
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
    console.error("POST /api/cron/weekly-report error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
