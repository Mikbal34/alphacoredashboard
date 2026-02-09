import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { taskSchema } from "@/lib/validations/task"
import { MESSAGES } from "@/lib/constants"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assigneeId = searchParams.get("assigneeId")
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    const where: any = {}

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    // Only show tasks from projects where user is a member
    where.project = {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    }

    const tasks = await prisma.task.findMany({
      where,
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
        creator: {
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { order: "asc" },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("GET /api/tasks error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = taskSchema.parse(body)

    // Check if user is a member of the project
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        members: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      )
    }

    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Get the highest order for the status
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId: validatedData.projectId,
        status: validatedData.status,
      },
      orderBy: {
        order: "desc",
      },
    })

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        creatorId: session.user.id,
        order: (lastTask?.order ?? 0) + 1,
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
        creator: {
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("POST /api/tasks error:", error)

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
