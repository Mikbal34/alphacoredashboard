import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { projectSchema } from "@/lib/validations/project"
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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
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
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            labels: {
              include: {
                label: true,
              },
            },
          },
          orderBy: [
            { status: "asc" },
            { order: "asc" },
          ],
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if user is a member of the project
    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Check if user is owner of the project
    const member = project.members.find((m) => m.userId === session.user.id)
    if (!member || member.role !== "OWNER") {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    const updatedProject = await prisma.project.update({
      where: { id },
      data: validatedData,
      include: {
        members: {
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
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error)

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

export async function DELETE(
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

    // Check if user is owner of the project
    const member = project.members.find((m) => m.userId === session.user.id)
    if (!member || member.role !== "OWNER") {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
