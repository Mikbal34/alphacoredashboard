"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InvoiceForm } from "@/components/finance/invoice-form"
import { InvoiceFormValues } from "@/lib/validations/invoice"
import { Plus, FileText, Calendar, User } from "lucide-react"
import { toast } from "sonner"

interface Invoice {
  id: string
  number: string
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  clientName: string
  issueDate: string
  dueDate: string
  items: {
    quantity: number
    unitPrice: number
  }[]
}

const statusConfig = {
  DRAFT: { label: "Taslak", variant: "secondary" as const },
  SENT: { label: "Gönderildi", variant: "default" as const },
  PAID: { label: "Ödendi", variant: "default" as const },
  OVERDUE: { label: "Gecikmiş", variant: "destructive" as const },
  CANCELLED: { label: "İptal", variant: "destructive" as const },
}

export default function FaturalarPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredInvoices(invoices)
    } else {
      setFilteredInvoices(invoices.filter((inv) => inv.status === activeTab))
    }
  }, [activeTab, invoices])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data || [])
      } else {
        toast.error("Faturalar yüklenemedi")
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      toast.error("Faturalar yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: InvoiceFormValues) => {
    try {
      setSubmitting(true)

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Fatura oluşturuldu")
        fetchInvoices()
        setDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Fatura oluşturulamadı")
      }
    } catch (error) {
      console.error("Failed to create invoice:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = (items: { quantity: number; unitPrice: number }[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturalar</h1>
          <p className="text-muted-foreground">Fatura yönetimi ve takibi</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Fatura</DialogTitle>
              <DialogDescription>
                Yeni bir fatura oluşturun ve kalemlerini ekleyin
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm onSubmit={handleSubmit} isLoading={submitting} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="DRAFT">Taslak</TabsTrigger>
          <TabsTrigger value="SENT">Gönderildi</TabsTrigger>
          <TabsTrigger value="PAID">Ödendi</TabsTrigger>
          <TabsTrigger value="OVERDUE">Gecikmiş</TabsTrigger>
          <TabsTrigger value="CANCELLED">İptal</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Fatura bulunamadı</h3>
              <p className="text-muted-foreground">
                Henüz hiç fatura oluşturmadınız
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/finans/faturalar/${invoice.id}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {invoice.number}
                        </CardTitle>
                        <Badge variant={statusConfig[invoice.status].variant}>
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.clientName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Düzenleme: {formatDate(invoice.issueDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Vade: {formatDate(invoice.dueDate)}</span>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Toplam</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(calculateTotal(invoice.items))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
