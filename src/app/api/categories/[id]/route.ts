import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validations/category"

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

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Category get error:", error)
    return NextResponse.json(
      { error: "Kategori alınamadı" },
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

    const existing = await prisma.category.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = categorySchema.parse(body)

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error("Category update error:", error)
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Kategori güncellenemedi" },
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

    const existing = await prisma.category.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
    }

    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: "Bu kategoriye ait işlemler var, silinemez" },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Kategori silindi" })
  } catch (error) {
    console.error("Category delete error:", error)
    return NextResponse.json(
      { error: "Kategori silinemedi" },
      { status: 500 }
    )
  }
}
