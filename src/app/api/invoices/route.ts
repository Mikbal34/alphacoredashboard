import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invoiceSchema } from "@/lib/validations/invoice"
import { InvoiceStatus } from "@/generated/prisma/client"
import { getUserFilter } from "@/lib/permissions"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status") as InvoiceStatus | null

    const userFilter = getUserFilter(session)
    const where: any = {}

    if (userFilter) {
      where.userId = userFilter
    }

    if (status) {
      where.status = status
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Invoices list error:", error)
    return NextResponse.json(
      { error: "Faturalar alınamadı" },
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
    const validatedData = invoiceSchema.parse(body)

    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { number: true },
    })

    const lastNumber = lastInvoice?.number?.match(/\d+$/)
    const nextNumber = lastNumber ? parseInt(lastNumber[0]) + 1 : 1
    const invoiceNumber = `FTR-${String(nextNumber).padStart(5, "0")}`

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        status: "DRAFT",
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail || null,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        notes: validatedData.notes || null,
        userId: session.user.id,
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

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error("Invoice create error:", error)
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
      { error: "Fatura oluşturulamadı" },
      { status: 500 }
    )
  }
}
