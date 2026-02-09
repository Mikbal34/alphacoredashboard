import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { userSchema } from "@/lib/validations/user"
import bcrypt from "bcryptjs"
import { MESSAGES } from "@/lib/constants"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("GET /api/users error:", error)
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
    const validation = userSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = validation.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kullanılıyor" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
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
        action: "created",
        entityType: "user",
        entityId: user.id,
        userId: session.user.id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
        },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("POST /api/users error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
