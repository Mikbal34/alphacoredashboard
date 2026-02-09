import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants"
import { z } from "zod"

const reorderSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  order: z.number().int().min(0),
})

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { taskId, status, order } = reorderSchema.parse(body)

    // Get the task and check permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if user is a member of the project
    const isMember = task.project.members.some(
      (member) => member.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Update the task's status and order
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        order,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("PATCH /api/tasks/reorder error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
