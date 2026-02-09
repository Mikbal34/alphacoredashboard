"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TransactionForm } from "@/components/finance/transaction-form"
import { TransactionFormValues } from "@/lib/validations/transaction"
import { Plus, Pencil, Trash2 } from "lucide-react"
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

interface Transaction {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  description: string
  date: string
  category: {
    id: string
    name: string
    color: string
  }
}

export default function GelirGiderPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "INCOME" | "EXPENSE">("all")

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredTransactions(transactions)
    } else {
      setFilteredTransactions(transactions.filter((t) => t.type === activeTab))
    }
  }, [activeTab, transactions])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/transactions?limit=1000")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      } else {
        toast.error("İşlemler yüklenemedi")
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast.error("İşlemler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      setSubmitting(true)

      if (editingTransaction) {
        const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          toast.success("İşlem güncellendi")
          fetchTransactions()
          setDialogOpen(false)
          setEditingTransaction(null)
        } else {
          toast.error("İşlem güncellenemedi")
        }
      } else {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          toast.success("İşlem oluşturuldu")
          fetchTransactions()
          setDialogOpen(false)
        } else {
          toast.error("İşlem oluşturulamadı")
        }
      }
    } catch (error) {
      console.error("Failed to submit transaction:", error)
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const response = await fetch(`/api/transactions/${deletingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("İşlem silindi")
        fetchTransactions()
        setDeleteDialogOpen(false)
        setDeletingId(null)
      } else {
        toast.error("İşlem silinemedi")
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error)
      toast.error("Bir hata oluştu")
    }
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
          <h1 className="text-3xl font-bold">Gelir & Gider</h1>
          <p className="text-muted-foreground">Tüm finansal işlemleriniz</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingTransaction(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni İşlem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? "İşlemi Düzenle" : "Yeni İşlem"}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? "İşlem bilgilerini güncelleyin"
                  : "Yeni bir gelir veya gider işlemi ekleyin"}
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              onSubmit={handleSubmit}
              defaultValues={
                editingTransaction
                  ? {
                      type: editingTransaction.type,
                      amount: editingTransaction.amount,
                      description: editingTransaction.description,
                      date: new Date(editingTransaction.date).toISOString().split("T")[0],
                      categoryId: editingTransaction.category.id,
                    }
                  : undefined
              }
              isLoading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="INCOME">Gelir</TabsTrigger>
          <TabsTrigger value="EXPENSE">Gider</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="w-[100px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Henüz işlem bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: transaction.category.color }}
                          />
                          {transaction.category.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "INCOME" ? "default" : "destructive"
                          }
                        >
                          {transaction.type === "INCOME" ? "Gelir" : "Gider"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          transaction.type === "INCOME"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTransaction(transaction)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingId(transaction.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşlemi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. İşlem kalıcı olarak silinecektir.
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
