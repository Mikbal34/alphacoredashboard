import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MESSAGES, DEFAULT_PAGE_SIZE } from "@/lib/constants"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))
    const entityType = searchParams.get("entityType") || undefined
    const userId = searchParams.get("userId") || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      entityType?: string
      userId?: string
    } = {}

    if (entityType) {
      where.entityType = entityType
    }

    if (userId) {
      where.userId = userId
    }

    // Get total count
    const total = await prisma.activityLog.count({ where })

    // Get activity logs with user info
    const logs = await prisma.activityLog.findMany({
      where,
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
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("GET /api/activity-log error:", error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.GENERIC },
      { status: 500 }
    )
  }
}
