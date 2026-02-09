import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, FileText } from "lucide-react"

interface KPICardsProps {
  income: number
  expense: number
  net: number
  pendingInvoices: number
}

export function KPICards({ income, expense, net, pendingInvoices }: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(income)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Toplam gelir tutarı
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(expense)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Toplam gider tutarı
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Kâr</CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${net >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {formatCurrency(net)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gelir - Gider
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bekleyen Fatura</CardTitle>
          <FileText className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(pendingInvoices)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ödenmemiş faturalar
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
