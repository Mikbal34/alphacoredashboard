import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants"

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

    // Check if user is a member of the project
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
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

    const tasks = await prisma.task.findMany({
      where: {
        projectId: id,
      },
      include: {
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
    console.error("GET /api/projects/[id]/tasks error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
