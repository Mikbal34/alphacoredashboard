import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants"
import { z } from "zod"

const commentSchema = z.object({
  content: z.string().min(1, "Yorum içeriği gereklidir"),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id },
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

    const isMember = task.project.members.some(
      (member) => member.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    const comments = await prisma.taskComment.findMany({
      where: {
        taskId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("GET /api/tasks/[id]/comments error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id },
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

    const isMember = task.project.members.some(
      (member) => member.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = commentSchema.parse(body)

    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId: id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("POST /api/tasks/[id]/comments error:", error)

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
