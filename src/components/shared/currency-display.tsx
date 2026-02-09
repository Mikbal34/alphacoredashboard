import { cn } from "@/lib/utils"

/**
 * CurrencyDisplay Component - Formats and displays currency in TRY
 *
 * Usage:
 * <CurrencyDisplay amount={1234.56} /> // ₺1.234,56 (green)
 * <CurrencyDisplay amount={-500} /> // -₺500,00 (red)
 * <CurrencyDisplay amount={0} className="text-lg font-bold" />
 */

interface CurrencyDisplayProps {
  amount: number
  className?: string
  showSign?: boolean
}

export function CurrencyDisplay({
  amount,
  className = "",
  showSign = true,
}: CurrencyDisplayProps) {
  const isPositive = amount > 0
  const isNegative = amount < 0
  const isZero = amount === 0

  const formatted = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  const colorClass = showSign && !isZero
    ? isPositive
      ? "text-green-600 dark:text-green-500"
      : isNegative
      ? "text-red-600 dark:text-red-500"
      : ""
    : ""

  return (
    <span className={cn("font-medium tabular-nums", colorClass, className)}>
      {isNegative && "-"}
      {formatted}
    </span>
  )
}
