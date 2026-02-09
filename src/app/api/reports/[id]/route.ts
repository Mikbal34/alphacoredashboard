import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants"
import { z } from "zod"

const reportScheduleUpdateSchema = z.object({
  name: z.string().min(1, "Rapor adı gereklidir").optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recipients: z.array(z.string().email("Geçerli email adresi giriniz")).min(1, "En az bir alıcı gereklidir").optional(),
  isActive: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const validation = reportScheduleUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Check if schedule exists
    const existingSchedule = await prisma.reportSchedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    const schedule = await prisma.reportSchedule.update({
      where: { id },
      data: validation.data,
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
        action: "updated",
        entityType: "report_schedule",
        entityId: schedule.id,
        userId: session.user.id,
        metadata: {
          scheduleName: schedule.name,
          frequency: schedule.frequency,
          isActive: schedule.isActive,
        },
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("PUT /api/reports/[id] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if schedule exists
    const schedule = await prisma.reportSchedule.findUnique({
      where: { id },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    await prisma.reportSchedule.delete({
      where: { id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "deleted",
        entityType: "report_schedule",
        entityId: schedule.id,
        userId: session.user.id,
        metadata: {
          scheduleName: schedule.name,
          frequency: schedule.frequency,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/reports/[id] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
