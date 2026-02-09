import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getResend } from "@/lib/resend"
import { DailyReportEmail } from "@/emails/daily-report"
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

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        category: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    // Calculate totals
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0)

    const net = income - expense

    // Get completed tasks today
    const completedTasks = await prisma.task.findMany({
      where: {
        status: "DONE",
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get active report schedules for daily reports
    const schedules = await prisma.reportSchedule.findMany({
      where: {
        frequency: "DAILY",
        isActive: true,
      },
    })

    const reportData = {
      date: today,
      summary: {
        income,
        expense,
        net,
      },
      transactions,
      completedTasksCount: completedTasks.length,
    }

    // Try to send emails to all recipients
    const emailResults = []
    for (const schedule of schedules) {
      for (const recipient of schedule.recipients) {
        try {
          const emailHtml = await render(DailyReportEmail(reportData))

          await getResend().emails.send({
            from: process.env.EMAIL_FROM || "noreply@alphacore.com",
            to: recipient,
            subject: `Günlük Rapor - ${today.toLocaleDateString("tr-TR")}`,
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
          entityId: "daily-report",
          userId: schedules[0].userId,
          metadata: {
            reportType: "daily",
            date: today.toISOString(),
            transactionsCount: transactions.length,
            completedTasksCount: completedTasks.length,
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
    console.error("POST /api/cron/daily-report error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
