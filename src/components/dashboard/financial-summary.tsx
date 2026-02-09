"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface FinancialSummaryProps {
  data: MonthlyData[]
}

// Turkish month names
const MONTH_NAMES: { [key: string]: string } = {
  "01": "Oca",
  "02": "Şub",
  "03": "Mar",
  "04": "Nis",
  "05": "May",
  "06": "Haz",
  "07": "Tem",
  "08": "Ağu",
  "09": "Eyl",
  "10": "Eki",
  "11": "Kas",
  "12": "Ara",
}

export function FinancialSummary({ data }: FinancialSummaryProps) {
  // Format data for chart with Turkish month names
  const formattedData = data.map((item) => {
    const [, month] = item.month.split("-")
    return {
      month: MONTH_NAMES[month] || month,
      Gelir: item.income,
      Gider: item.expense,
    }
  })

  // Custom tooltip formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finansal Özet</CardTitle>
        <CardDescription>Son 12 ayın gelir ve gider grafiği</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                }}
              />
              <Area
                type="monotone"
                dataKey="Gelir"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="Gider"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
