import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { transactionSchema } from "@/lib/validations/transaction"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Transaction get error:", error)
    return NextResponse.json(
      { error: "İşlem alınamadı" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = transactionSchema.parse(body)

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(transaction)
  } catch (error: any) {
    console.error("Transaction update error:", error)
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "İşlem güncellenemedi" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 })
    }

    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ message: "İşlem silindi" })
  } catch (error) {
    console.error("Transaction delete error:", error)
    return NextResponse.json(
      { error: "İşlem silinemedi" },
      { status: 500 }
    )
  }
}
