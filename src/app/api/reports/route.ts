import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants"
import { z } from "zod"

const reportScheduleSchema = z.object({
  name: z.string().min(1, "Rapor adı gereklidir"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  recipients: z.array(z.string().email("Geçerli email adresi giriniz")).min(1, "En az bir alıcı gereklidir"),
  isActive: z.boolean().optional().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const schedules = await prisma.reportSchedule.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("GET /api/reports error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validation = reportScheduleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, frequency, recipients, isActive } = validation.data

    const schedule = await prisma.reportSchedule.create({
      data: {
        name,
        frequency,
        recipients,
        isActive,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "created",
        entityType: "report_schedule",
        entityId: schedule.id,
        userId: session.user.id,
        metadata: {
          scheduleName: schedule.name,
          frequency: schedule.frequency,
        },
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("POST /api/reports error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
