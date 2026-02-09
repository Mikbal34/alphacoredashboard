import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validations/category"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type")

    const where: any = {}
    if (type) {
      where.type = type
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Categories list error:", error)
    return NextResponse.json(
      { error: "Kategoriler alınamadı" },
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
    const validatedData = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: validatedData,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Category create error:", error)
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Kategori oluşturulamadı" },
      { status: 500 }
    )
  }
}
