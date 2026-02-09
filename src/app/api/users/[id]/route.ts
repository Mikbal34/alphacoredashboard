import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { userEditSchema } from "@/lib/validations/user"
import bcrypt from "bcryptjs"
import { MESSAGES } from "@/lib/constants"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        projectMembers: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("GET /api/users/[id] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}

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
    const validation = userEditSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Bu email adresi zaten kullanılıyor" },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: {
      name: string
      email: string
      hashedPassword?: string
    } = {
      name,
      email,
    }

    // Hash new password if provided
    if (password && password.trim() !== "") {
      updateData.hashedPassword = await bcrypt.hash(password, 10)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "updated",
        entityType: "user",
        entityId: user.id,
        userId: session.user.id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
        },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error)
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

    // Cannot delete self
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Kendi hesabınızı silemezsiniz" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.NOT_FOUND },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "deleted",
        entityType: "user",
        entityId: user.id,
        userId: session.user.id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
