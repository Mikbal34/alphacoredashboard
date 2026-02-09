import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invoiceSchema } from "@/lib/validations/invoice"

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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Invoice get error:", error)
    return NextResponse.json(
      { error: "Fatura alınamadı" },
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

    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = invoiceSchema.parse(body)

    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    })

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail || null,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        notes: validatedData.notes || null,
        items: {
          create: validatedData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error("Invoice update error:", error)
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri", details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Bu fatura numarası zaten kullanılıyor" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Fatura güncellenemedi" },
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

    const existing = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Fatura bulunamadı" }, { status: 404 })
    }

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Fatura silindi" })
  } catch (error) {
    console.error("Invoice delete error:", error)
    return NextResponse.json(
      { error: "Fatura silinemedi" },
      { status: 500 }
    )
  }
}
