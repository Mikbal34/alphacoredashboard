"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FinancialChart } from "@/components/finance/financial-chart"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface Transaction {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: string
  category: {
    id: string
    name: string
    color: string
  }
}

type Period = "7days" | "30days" | "3months" | "6months" | "1year" | "all"

export default function RaporlarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("30days")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/transactions?limit=10000")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTransactions = () => {
    const now = new Date()
    let startDate: Date | null = null

    switch (period) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "3months":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "6months":
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case "1year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case "all":
      default:
        return transactions
    }

    return transactions.filter((t) => new Date(t.date) >= startDate!)
  }

  const calculateSummary = () => {
    const filtered = getFilteredTransactions()

    const income = filtered
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = filtered
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0)

    const net = income - expense

    return { income, expense, net }
  }

  const getCategoryComparison = () => {
    const filtered = getFilteredTransactions()
    const categoryTotals: Record<
      string,
      { name: string; gelir: number; gider: number; color: string }
    > = {}

    filtered.forEach((t) => {
      if (!categoryTotals[t.category.id]) {
        categoryTotals[t.category.id] = {
          name: t.category.name,
          gelir: 0,
          gider: 0,
          color: t.category.color,
        }
      }

      if (t.type === "INCOME") {
        categoryTotals[t.category.id].gelir += t.amount
      } else {
        categoryTotals[t.category.id].gider += t.amount
      }
    })

    return Object.values(categoryTotals)
      .sort((a, b) => b.gelir + b.gider - (a.gelir + a.gider))
      .slice(0, 10)
  }

  const getTopCategories = () => {
    const filtered = getFilteredTransactions()
    const categoryTotals: Record<
      string,
      { name: string; amount: number; type: string; count: number; color: string }
    > = {}

    filtered.forEach((t) => {
      if (!categoryTotals[t.category.id]) {
        categoryTotals[t.category.id] = {
          name: t.category.name,
          amount: 0,
          type: t.type,
          count: 0,
          color: t.category.color,
        }
      }
      categoryTotals[t.category.id].amount += t.amount
      categoryTotals[t.category.id].count++
    })

    return Object.values(categoryTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }

  const summary = calculateSummary()
  const categoryComparison = getCategoryComparison()
  const topCategories = getTopCategories()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const periodLabels: Record<Period, string> = {
    "7days": "Son 7 Gün",
    "30days": "Son 30 Gün",
    "3months": "Son 3 Ay",
    "6months": "Son 6 Ay",
    "1year": "Son 1 Yıl",
    all: "Tüm Zamanlar",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finansal Raporlar</h1>
          <p className="text-muted-foreground">
            Detaylı finansal analiz ve istatistikler
          </p>
        </div>

        <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Son 7 Gün</SelectItem>
            <SelectItem value="30days">Son 30 Gün</SelectItem>
            <SelectItem value="3months">Son 3 Ay</SelectItem>
            <SelectItem value="6months">Son 6 Ay</SelectItem>
            <SelectItem value="1year">Son 1 Yıl</SelectItem>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Gelir
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.income)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodLabels[period]}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Toplam Gider
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.expense)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodLabels[period]}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Kâr/Zarar</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    summary.net >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(summary.net)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodLabels[period]}
                </p>
              </CardContent>
            </Card>
          </div>

          <FinancialChart
            title="Gelir vs Gider (Kategorilere Göre)"
            data={categoryComparison}
            type="bar"
            dataKeys={{ x: "name", y: "gelir", y2: "gider" }}
          />

          <Card>
            <CardHeader>
              <CardTitle>En Çok Harcama Yapılan Kategoriler</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-right">İşlem Sayısı</TableHead>
                    <TableHead className="text-right">Toplam Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Veri bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    topCategories.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              category.type === "INCOME"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {category.type === "INCOME" ? "Gelir" : "Gider"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {category.count}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            category.type === "INCOME"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(category.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
