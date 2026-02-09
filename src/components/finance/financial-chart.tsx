"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface FinancialChartProps {
  title: string
  data: any[]
  type: "area" | "bar" | "pie"
  dataKeys?: {
    x?: string
    y?: string
    y2?: string
    name?: string
    value?: string
  }
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
]

export function FinancialChart({ title, data, type, dataKeys }: FinancialChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={dataKeys?.x || "name"}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={dataKeys?.y || "gelir"}
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Gelir"
              />
              <Area
                type="monotone"
                dataKey={dataKeys?.y2 || "gider"}
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Gider"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={dataKeys?.x || "name"}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              <Bar
                dataKey={dataKeys?.y || "gelir"}
                fill="#10b981"
                name="Gelir"
              />
              <Bar
                dataKey={dataKeys?.y2 || "gider"}
                fill="#ef4444"
                name="Gider"
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKeys?.value || "value"}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                contentStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  )
}
