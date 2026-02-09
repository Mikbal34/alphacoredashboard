import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { transactionSchema } from "@/lib/validations/transaction"
import { TransactionType } from "@/generated/prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type") as TransactionType | null
    const categoryId = searchParams.get("categoryId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
    }

    if (type) {
      where.type = type
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Transaction list error:", error)
    return NextResponse.json(
      { error: "İşlemler alınamadı" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = transactionSchema.parse(body)

    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error("Transaction create error:", error)
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "İşlem oluşturulamadı" },
      { status: 500 }
    )
  }
}
