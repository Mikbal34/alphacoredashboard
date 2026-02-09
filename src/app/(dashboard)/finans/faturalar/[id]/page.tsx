"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InvoiceForm } from "@/components/finance/invoice-form"
import { InvoiceFormValues } from "@/lib/validations/invoice"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Invoice {
  id: string
  number: string
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  clientName: string
  clientEmail: string | null
  issueDate: string
  dueDate: string
  notes: string | null
  items: {
    id: string
    description: string
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

export default function FaturaDetayPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        toast.error("Fatura yüklenemedi")
        router.push("/finans/faturalar")
      }
    } catch (error) {
      console.error("Failed to fetch invoice:", error)
      toast.error("Fatura yüklenemedi")
      router.push("/finans/faturalar")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!invoice) return

    try {
      setUpdatingStatus(true)

      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: invoice.number,
          status: newStatus,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail || "",
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          notes: invoice.notes || "",
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })

      if (response.ok) {
        toast.success("Fatura durumu güncellendi")
        fetchInvoice()
      } else {
        toast.error("Durum güncellenemedi")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleEdit = async (data: InvoiceFormValues) => {
    if (!invoice) return

    try {
      setSubmitting(true)

      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Fatura güncellendi")
        fetchInvoice()
        setEditDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Fatura güncellenemedi")
      }
    } catch (error) {
      console.error("Failed to update invoice:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Fatura silindi")
        router.push("/finans/faturalar")
      } else {
        toast.error("Fatura silinemedi")
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error)
      toast.error("Bir hata oluştu")
    }
  }

  const calculateTotal = () => {
    if (!invoice) return 0
    return invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
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
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/finans/faturalar")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.number}</h1>
            <p className="text-muted-foreground">{invoice.clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fatura Detayları</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Durum:</span>
              <Select
                value={invoice.status}
                onValueChange={handleUpdateStatus}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Taslak</SelectItem>
                  <SelectItem value="SENT">Gönderildi</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="OVERDUE">Gecikmiş</SelectItem>
                  <SelectItem value="CANCELLED">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Müşteri</p>
              <p className="font-medium">{invoice.clientName}</p>
              {invoice.clientEmail && (
                <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Düzenleme Tarihi</p>
              <p className="font-medium">{formatDate(invoice.issueDate)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Vade Tarihi</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Durum</p>
              <Badge variant={statusConfig[invoice.status].variant} className="mt-1">
                {statusConfig[invoice.status].label}
              </Badge>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notlar</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Kalemler</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex justify-end">
            <div className="text-right space-y-2">
              <div className="flex justify-between gap-12">
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span className="font-medium">{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between gap-12 text-lg font-bold">
                <span>Toplam:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faturayı Düzenle</DialogTitle>
            <DialogDescription>
              Fatura bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            onSubmit={handleEdit}
            defaultValues={{
              clientName: invoice.clientName,
              clientEmail: invoice.clientEmail || "",
              issueDate: new Date(invoice.issueDate),
              dueDate: new Date(invoice.dueDate),
              notes: invoice.notes || "",
              items: invoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            }}
            isLoading={submitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Faturayı silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Fatura kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
