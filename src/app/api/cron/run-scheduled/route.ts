import { NextRequest, NextResponse } from "next/server"
import { ReportFrequency } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getResend } from "@/lib/resend"
import { DailyReportEmail } from "@/emails/daily-report"
import { WeeklyReportEmail } from "@/emails/weekly-report"
import { MonthlyReportEmail } from "@/emails/monthly-report"
import { render } from "@react-email/components"

// ──────────────────────────────────────────────
// Smart cron endpoint — called once per day
// Schedule: 0 8 * * * (08:00 UTC = 11:00 TR)
//
// • DAILY   → her gün
// • WEEKLY  → sadece Pazartesi (getDay() === 1)
// • MONTHLY → sadece ayın 1'i
// ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sun … 1=Mon
    const dayOfMonth = now.getDate()

    // Decide which frequencies to run today
    const frequenciesToRun: ReportFrequency[] = ["DAILY"]
    if (dayOfWeek === 1) frequenciesToRun.push("WEEKLY")
    if (dayOfMonth === 1) frequenciesToRun.push("MONTHLY")

    // Fetch all active schedules for the relevant frequencies
    const schedules = await prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        frequency: { in: frequenciesToRun },
      },
    })

    if (schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active schedules to run",
        frequenciesChecked: frequenciesToRun,
      })
    }

    const results: Record<string, unknown> = {}

    // ── DAILY ────────────────────────────────
    const dailySchedules = schedules.filter((s) => s.frequency === "DAILY")
    if (dailySchedules.length > 0) {
      results.daily = await runDailyReport(dailySchedules, now)
    }

    // ── WEEKLY (Monday only) ─────────────────
    const weeklySchedules = schedules.filter((s) => s.frequency === "WEEKLY")
    if (weeklySchedules.length > 0) {
      results.weekly = await runWeeklyReport(weeklySchedules, now)
    }

    // ── MONTHLY (1st of month) ───────────────
    const monthlySchedules = schedules.filter((s) => s.frequency === "MONTHLY")
    if (monthlySchedules.length > 0) {
      results.monthly = await runMonthlyReport(monthlySchedules, now)
    }

    return NextResponse.json({
      success: true,
      frequenciesRun: frequenciesToRun,
      results,
    })
  } catch (error) {
    console.error("POST /api/cron/run-scheduled error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────
// Daily report logic
// ──────────────────────────────────────────────
async function runDailyReport(
  schedules: Array<{ id: string; recipients: string[]; userId: string }>,
  now: Date
) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: {
      category: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { date: "desc" },
  })

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0)

  const completedTasks = await prisma.task.count({
    where: { status: "DONE", updatedAt: { gte: today, lt: tomorrow } },
  })

  const reportData = {
    date: today,
    summary: { income, expense, net: income - expense },
    transactions,
    completedTasksCount: completedTasks,
  }

  const emailResults = await sendEmails(schedules, async (recipient) => {
    const html = await render(DailyReportEmail(reportData))
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || "noreply@alphacore.com.tr",
      to: recipient,
      subject: `Günlük Rapor - ${today.toLocaleDateString("tr-TR")}`,
      html,
    })
  })

  await logActivity(schedules, "daily", {
    date: today.toISOString(),
    transactionsCount: transactions.length,
    completedTasksCount: completedTasks,
    ...emailStats(emailResults),
  })

  return { schedulesProcessed: schedules.length, emailResults }
}

// ──────────────────────────────────────────────
// Weekly report logic
// ──────────────────────────────────────────────
async function runWeeklyReport(
  schedules: Array<{ id: string; recipients: string[]; userId: string }>,
  now: Date
) {
  // Previous week (Mon-Sun)
  const weekEnd = new Date(now)
  weekEnd.setHours(0, 0, 0, 0)
  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekStart.getDate() - 7)

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
    include: { category: true },
  })

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0)

  const allTasks = await prisma.task.findMany({
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
  })

  const topCategories = buildTopCategories(transactions)

  const reportData = {
    weekStart,
    weekEnd,
    financialSummary: { income, expense, net: income - expense },
    taskStatistics: {
      completed: allTasks.filter((t) => t.status === "DONE").length,
      inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      total: allTasks.length,
    },
    topCategories,
    transactionsCount: transactions.length,
  }

  const emailResults = await sendEmails(schedules, async (recipient) => {
    const html = await render(WeeklyReportEmail(reportData))
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || "noreply@alphacore.com.tr",
      to: recipient,
      subject: `Haftalık Rapor - ${weekStart.toLocaleDateString("tr-TR")} - ${weekEnd.toLocaleDateString("tr-TR")}`,
      html,
    })
  })

  await logActivity(schedules, "weekly", {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    transactionsCount: transactions.length,
    tasksCompleted: reportData.taskStatistics.completed,
    ...emailStats(emailResults),
  })

  return { schedulesProcessed: schedules.length, emailResults }
}

// ──────────────────────────────────────────────
// Monthly report logic
// ──────────────────────────────────────────────
async function runMonthlyReport(
  schedules: Array<{ id: string; recipients: string[]; userId: string }>,
  now: Date
) {
  // Previous month
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const monthStart = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1)

  // Two months ago (for comparison)
  const prevMonthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0, 23, 59, 59, 999)
  const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
    include: { category: true },
  })

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0)
  const net = income - expense

  // Previous month net
  const prevTransactions = await prisma.transaction.findMany({
    where: { date: { gte: prevMonthStart, lte: prevMonthEnd } },
  })
  const prevIncome = prevTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0)
  const prevExpense = prevTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0)
  const previousMonthNet = prevTransactions.length > 0 ? prevIncome - prevExpense : null

  const allTasks = await prisma.task.findMany({
    where: { createdAt: { gte: monthStart, lte: monthEnd } },
  })

  const topCategories = buildTopCategories(transactions)

  const reportData = {
    monthStart,
    monthEnd,
    financialSummary: { income, expense, net },
    taskStatistics: {
      completed: allTasks.filter((t) => t.status === "DONE").length,
      inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      total: allTasks.length,
    },
    topCategories,
    transactionsCount: transactions.length,
    previousMonthNet,
  }

  const emailResults = await sendEmails(schedules, async (recipient) => {
    const html = await render(MonthlyReportEmail(reportData))
    await getResend().emails.send({
      from: process.env.EMAIL_FROM || "noreply@alphacore.com.tr",
      to: recipient,
      subject: `Aylık Rapor - ${monthStart.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}`,
      html,
    })
  })

  await logActivity(schedules, "monthly", {
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    transactionsCount: transactions.length,
    tasksCompleted: reportData.taskStatistics.completed,
    ...emailStats(emailResults),
  })

  return { schedulesProcessed: schedules.length, emailResults }
}

// ──────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────

type EmailResult = { recipient: string; success: boolean; error?: string }

async function sendEmails(
  schedules: Array<{ id: string; recipients: string[] }>,
  sendFn: (recipient: string) => Promise<void>
): Promise<EmailResult[]> {
  const results: EmailResult[] = []

  for (const schedule of schedules) {
    for (const recipient of schedule.recipients) {
      try {
        await sendFn(recipient)
        results.push({ recipient, success: true })
      } catch (err) {
        console.error(`Failed to send email to ${recipient}:`, err)
        results.push({ recipient, success: false, error: String(err) })
      }
    }

    await prisma.reportSchedule.update({
      where: { id: schedule.id },
      data: { lastRunAt: new Date() },
    })
  }

  return results
}

function buildTopCategories(
  transactions: Array<{ type: string; amount: number; category: { name: string } }>
) {
  const categoryExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => {
      acc[t.category.name] = (acc[t.category.name] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  return Object.entries(categoryExpenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }))
}

async function logActivity(
  schedules: Array<{ userId: string }>,
  reportType: string,
  metadata: Record<string, unknown>
) {
  if (schedules.length === 0) return

  await prisma.activityLog.create({
    data: {
      action: "generated",
      entityType: "report",
      entityId: `${reportType}-report`,
      userId: schedules[0].userId,
      metadata: { reportType, ...metadata },
    },
  })
}

function emailStats(results: EmailResult[]) {
  return {
    emailsSent: results.filter((r) => r.success).length,
    emailsFailed: results.filter((r) => !r.success).length,
  }
}
