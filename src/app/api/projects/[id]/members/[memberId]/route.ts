import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants"
import { canManageProject } from "@/lib/permissions"
import { z } from "zod"

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "MEMBER", "VIEWER"]),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params

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

    if (!canManageProject(session, project.members)) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
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

    return NextResponse.json(member)
  } catch (error) {
    console.error("PUT /api/projects/[id]/members/[memberId] error:", error)

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
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params

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

    if (!canManageProject(session, project.members)) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 403 }
      )
    }

    const memberToRemove = project.members.find((m) => m.id === memberId)
    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Üye bulunamadı" },
        { status: 404 }
      )
    }

    if (memberToRemove.role === "OWNER") {
      const ownerCount = project.members.filter((m) => m.role === "OWNER").length
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Projenin son sahibi silinemez" },
          { status: 400 }
        )
      }
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/projects/[id]/members/[memberId] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
