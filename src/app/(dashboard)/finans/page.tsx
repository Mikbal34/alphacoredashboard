"use client"

import { useEffect, useState } from "react"
import { KPICards } from "@/components/finance/kpi-cards"
import { FinancialChart } from "@/components/finance/financial-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

interface Invoice {
  id: string
  status: string
  items: {
    quantity: number
    unitPrice: number
  }[]
}

export default function FinansPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transactionsRes, invoicesRes] = await Promise.all([
        fetch("/api/transactions?limit=1000"),
        fetch("/api/invoices"),
      ])

      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setInvoices(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateKPIs = () => {
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0)

    const net = income - expense

    const pendingInvoices = invoices
      .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
      .reduce((sum, inv) => {
        const total = inv.items.reduce(
          (itemSum, item) => itemSum + item.quantity * item.unitPrice,
          0
        )
        return sum + total
      }, 0)

    return { income, expense, net, pendingInvoices }
  }

  const getCategoryBreakdown = () => {
    const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE")
    const categoryTotals: Record<string, { name: string; value: number; color: string }> = {}

    expenseTransactions.forEach((t) => {
      if (!categoryTotals[t.category.id]) {
        categoryTotals[t.category.id] = {
          name: t.category.name,
          value: 0,
          color: t.category.color,
        }
      }
      categoryTotals[t.category.id].value += t.amount
    })

    return Object.values(categoryTotals).sort((a, b) => b.value - a.value)
  }

  const getMonthlyTrend = () => {
    const last6Months: Record<string, { gelir: number; gider: number }> = {}
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })
      last6Months[key] = { gelir: 0, gider: 0 }
    }

    transactions.forEach((t) => {
      const date = new Date(t.date)
      const key = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })

      if (last6Months[key]) {
        if (t.type === "INCOME") {
          last6Months[key].gelir += t.amount
        } else {
          last6Months[key].gider += t.amount
        }
      }
    })

    return Object.entries(last6Months).map(([name, values]) => ({
      name,
      ...values,
    }))
  }

  const kpis = calculateKPIs()
  const categoryBreakdown = getCategoryBreakdown()
  const monthlyTrend = getMonthlyTrend()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Finans</h1>
          <p className="text-muted-foreground">Finansal genel bakış ve raporlar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finans</h1>
        <p className="text-muted-foreground">Finansal genel bakış ve raporlar</p>
      </div>

      <KPICards
        income={kpis.income}
        expense={kpis.expense}
        net={kpis.net}
        pendingInvoices={kpis.pendingInvoices}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <FinancialChart
          title="Gider Dağılımı (Kategorilere Göre)"
          data={categoryBreakdown}
          type="pie"
          dataKeys={{ name: "name", value: "value" }}
        />

        <FinancialChart
          title="Aylık Gelir-Gider Trendi"
          data={monthlyTrend}
          type="area"
          dataKeys={{ x: "name", y: "gelir", y2: "gider" }}
        />
      </div>
    </div>
  )
}
